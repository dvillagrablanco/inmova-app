import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { paymentCreateSchema } from '@/lib/validations';
import {
  cachedPayments,
  invalidatePaymentsCache,
  invalidateDashboardCache,
} from '@/lib/api-cache-helpers';
import { withPaymentRateLimit } from '@/lib/rate-limiting';
import { resolveCompanyScope } from '@/lib/company-scope';
import { buildPaymentScopeFilter } from '@/lib/unit-scope';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  return withPaymentRateLimit(req, async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      const scope = await resolveCompanyScope({
        userId: session.user.id as string,
        role: session.user.role as any,
        primaryCompanyId: session.user?.companyId,
        request: req,
      });

      if (!scope.activeCompanyId) {
        return NextResponse.json({ error: 'CompanyId no encontrado' }, { status: 400 });
      }

      const { searchParams } = new URL(req.url);
      const estado = searchParams.get('estado');
      const contractId = searchParams.get('contractId');
      const buildingId = searchParams.get('buildingId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      // Si hay filtros o paginación, no usar caché
      const hasFilters = estado || contractId || buildingId;
      const usePagination = searchParams.has('page') || searchParams.has('limit');

      if (hasFilters || usePagination) {
        // Imputado por sociedad propietaria real de la unidad
        const where: any = { AND: [buildPaymentScopeFilter(scope.scopeCompanyIds)] };
        if (buildingId) {
          where.AND.push({ contract: { unit: { buildingId } } });
        }
        if (estado) where.estado = estado;
        if (contractId) where.contractId = contractId;

        // Con paginación
        if (usePagination) {
          const [payments, total] = await Promise.all([
            prisma.payment.findMany({
              where,
              include: {
                contract: {
                  include: {
                    unit: {
                      include: {
                        building: true,
                      },
                    },
                    tenant: true,
                  },
                },
              },
              orderBy: { fechaVencimiento: 'desc' },
              skip,
              take: limit,
            }),
            prisma.payment.count({ where }),
          ]);

          // Convertir valores Decimal a números
          const paymentsWithNumbers = payments.map((payment) => ({
            ...payment,
            monto: Number(payment.monto || 0),
          }));

          return NextResponse.json({
            data: paymentsWithNumbers,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasMore: skip + limit < total,
            },
          });
        }

        // Sin paginación pero con filtros
        const payments = await prisma.payment.findMany({
          where,
          include: {
            contract: {
              include: {
                unit: {
                  include: {
                    building: true,
                  },
                },
                tenant: true,
              },
            },
          },
          orderBy: { fechaVencimiento: 'desc' },
        });

        // Convertir valores Decimal a números
        const paymentsWithNumbers = payments.map((payment) => ({
          ...payment,
          monto: Number(payment.monto || 0),
        }));

        return NextResponse.json(paymentsWithNumbers);
      }

      // Sin filtros ni paginación, usar caché
      let paymentsResult: any[] = [];

      if (scope.scopeCompanyIds.length > 1) {
        const payments = await prisma.payment.findMany({
          where: {
            contract: {
              unit: {
                building: { companyId: { in: scope.scopeCompanyIds } },
              },
            },
          },
          include: {
            contract: {
              include: {
                unit: {
                  include: {
                    building: true,
                  },
                },
                tenant: true,
              },
            },
          },
          orderBy: { fechaVencimiento: 'desc' },
        });

        paymentsResult = payments.map((payment) => ({
          ...payment,
          monto: Number(payment.monto || 0),
        }));
      } else {
        const payments = await prisma.payment.findMany({
          where: {
            contract: {
              unit: {
                building: { companyId: { in: scope.scopeCompanyIds } },
              },
            },
          },
          include: {
            contract: {
              include: {
                unit: { include: { building: true } },
                tenant: true,
              },
            },
          },
          orderBy: { fechaVencimiento: 'desc' },
        });
        paymentsResult = payments.map((payment) => ({
          ...payment,
          monto: Number(payment.monto || 0),
        }));
      }

      // Si no hay pagos operativos, hacer fallback a AccountingTransaction (ingresos contables)
      if (paymentsResult.length === 0 && scope.activeCompanyId) {
        const accountingIncome = await prisma.accountingTransaction.findMany({
          where: {
            companyId: { in: scope.scopeCompanyIds },
            tipo: 'ingreso',
          },
          orderBy: { fecha: 'desc' },
          take: 50,
        });

        if (accountingIncome.length > 0) {
          const mapped = accountingIncome.map((tx: any) => ({
            id: tx.id,
            monto: Number(tx.monto || 0),
            estado: 'pagado',
            fechaPago: tx.fecha?.toISOString() || null,
            fechaVencimiento: tx.fecha?.toISOString() || new Date().toISOString(),
            periodo: tx.fecha
              ? new Date(tx.fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              : '',
            metodoPago: 'contabilidad',
            notas: tx.notas || tx.referencia || '',
            contract: {
              tenant: {
                nombreCompleto: tx.concepto || 'Ingreso contable',
              },
              unit: {
                numero: tx.categoria || '',
                building: {
                  nombre:
                    tx.categoria?.replace(/^ingreso_renta_?/, '').replace(/_/g, ' ') ||
                    'Contabilidad',
                },
              },
            },
            source: 'accounting',
          }));

          logger.info(`Pagos/ingresos contables (fallback): ${mapped.length}`, {
            companyId: scope.activeCompanyId,
          });
          return NextResponse.json(mapped);
        }
      }

      return NextResponse.json(paymentsResult);
    } catch (error) {
      logger.error('Error fetching payments:', error);
      Sentry.captureException(error);
      return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  return withPaymentRateLimit(req, async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const body = await req.json();

      const dataToValidate = { ...body };

      // Validación con Zod
      const validationResult = paymentCreateSchema.safeParse(dataToValidate);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Validation error creating payment:', { errors });
        return NextResponse.json(
          { error: 'Datos inv\u00e1lidos', details: errors },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;
      const scope = await resolveCompanyScope({
        userId: session.user.id as string,
        role: session.user.role as any,
        primaryCompanyId: session.user?.companyId,
        request: req,
      });

      if (!scope.activeCompanyId) {
        return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
      }

      const payment = await prisma.payment.create({
        data: {
          contractId: validatedData.contractId,
          periodo: validatedData.periodo ?? validatedData.concepto ?? 'Pago de renta',
          monto: validatedData.monto,
          fechaVencimiento: new Date(validatedData.fechaVencimiento),
          fechaPago: validatedData.fechaPago ? new Date(validatedData.fechaPago) : null,
          estado: validatedData.estado || 'pendiente',
          metodoPago: validatedData.metodoPago || null,
          concepto: validatedData.concepto ?? null,
          referencia: validatedData.referencia ?? null,
          baseImponible: validatedData.baseImponible ?? null,
          iva: validatedData.iva ?? null,
          irpf: validatedData.irpf ?? null,
        },
      });

      // Invalidar cachés relacionados
      await invalidatePaymentsCache(scope.activeCompanyId);
      await invalidateDashboardCache(scope.activeCompanyId);

      logger.info('Payment created successfully', { paymentId: payment.id });

      // Sincronizar ingreso con Zucchetti (async, no bloqueante)
      // Solo si el pago está marcado como pagado
      if (scope.activeCompanyId && (validatedData.estado === 'pagado' || validatedData.fechaPago)) {
        // Zucchetti sync (disabled - module removed in cleanup)
        Promise.resolve()
          .then(async () => {
            return;
          })
          .catch(() => {});
      }

      return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
      logError(error, { context: 'Error creating payment' });
      return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
    }
  });
}

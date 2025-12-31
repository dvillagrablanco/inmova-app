import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { paymentCreateSchema } from '@/lib/validations';
import { cachedPayments, invalidatePaymentsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { withPaymentRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withPaymentRateLimit(req, async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const contractId = searchParams.get('contractId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Si hay filtros o paginación, no usar caché
    const hasFilters = estado || contractId;
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (hasFilters || usePagination) {
      const where: any = {
        contract: {
          unit: { building: { companyId } },
        },
      };
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
        const paymentsWithNumbers = payments.map(payment => ({
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
      const paymentsWithNumbers = payments.map(payment => ({
        ...payment,
        monto: Number(payment.monto || 0),
      }));

      return NextResponse.json(paymentsWithNumbers);
    }

    // Sin filtros ni paginación, usar caché
    const payments = await cachedPayments(companyId);
    return NextResponse.json(payments);
  } catch (error) {
    logger.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
  });
}

export async function POST(req: NextRequest) {
  return withPaymentRateLimit(req, async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    
    // Asegurar que "concepto" esté presente (usar "periodo" si no está definido)
    const dataToValidate = {
      ...body,
      concepto: body.concepto || body.periodo || 'Pago de renta'
    };
    
    // Validación con Zod
    const validationResult = paymentCreateSchema.safeParse(dataToValidate);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating payment:', { errors });
      return NextResponse.json(
        { error: 'Datos inv\u00e1lidos', details: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const companyId = session.user?.companyId;

    const payment = await prisma.payment.create({
      data: {
        contractId: validatedData.contractId,
        periodo: validatedData.concepto, // Mapear concepto a periodo
        monto: validatedData.monto,
        fechaVencimiento: new Date(validatedData.fechaVencimiento),
        fechaPago: validatedData.fechaPago ? new Date(validatedData.fechaPago) : null,
        estado: validatedData.estado || 'pendiente',
        metodoPago: validatedData.metodoPago || null,
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidatePaymentsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    logger.info('Payment created successfully', { paymentId: payment.id });
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating payment' });
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
  });
}

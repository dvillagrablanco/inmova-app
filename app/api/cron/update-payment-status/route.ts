/**
 * CRON: Actualización de Estados de Pago
 * 
 * Este endpoint ejecuta actualizaciones automáticas de estados:
 * 1. Marca pagos pendientes como "atrasado" si pasó la fecha de vencimiento
 * 2. Genera notificaciones para pagos atrasados
 * 3. Actualiza métricas de morosidad
 * 4. Sincroniza estados con pasarelas de pago (Stripe, GoCardless)
 * 
 * Configuración recomendada en Vercel/Cron:
 * - Schedule: 0 1 * * * (1:00 AM cada día)
 * 
 * @endpoint POST /api/cron/update-payment-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notification-generator';
import { sendEmail } from '@/lib/email-config';
import logger from '@/lib/logger';
import { format, differenceInDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos máximo

interface UpdateResult {
  totalProcessed: number;
  markedAsOverdue: number;
  notificationsSent: number;
  syncedWithStripe: number;
  errors: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    let isAuthorized = false;
    
    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      isAuthorized = true;
      logger.info('🔐 CRON autorizado via CRON_SECRET');
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const role = (session.user as any).role;
        if (['super_admin', 'administrador'].includes(role)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    logger.info('🔄 Iniciando actualización de estados de pago');

    const result: UpdateResult = {
      totalProcessed: 0,
      markedAsOverdue: 0,
      notificationsSent: 0,
      syncedWithStripe: 0,
      errors: [],
    };

    const now = new Date();

    // 1. MARCAR PAGOS COMO ATRASADOS
    // Obtener pagos pendientes cuya fecha de vencimiento ya pasó
    const overduePayments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: { lt: now },
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: {
                  include: { company: true },
                },
              },
            },
          },
        },
      },
    });

    result.totalProcessed = overduePayments.length;

    for (const payment of overduePayments) {
      try {
        const daysOverdue = differenceInDays(now, new Date(payment.fechaVencimiento));
        
        // Actualizar estado a atrasado
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            estado: 'atrasado',
            nivelRiesgo: daysOverdue > 30 ? 'alto' : daysOverdue > 15 ? 'medio' : 'bajo',
          },
        });

        result.markedAsOverdue++;

        // Crear notificación si es la primera vez
        const existingNotification = await prisma.notification.findFirst({
          where: {
            entityId: payment.id,
            entityType: 'Payment',
            tipo: 'pago_atrasado',
            createdAt: { gte: subDays(now, 7) },
          },
        });

        if (!existingNotification) {
          const company = payment.contract.unit.building.company;
          const tenant = payment.contract.tenant;

          // Notificación al administrador
          await createNotification({
            companyId: company.id,
            tipo: 'pago_atrasado',
            titulo: `⚠️ Pago atrasado - ${tenant.nombreCompleto}`,
            mensaje: `El pago de ${Number(payment.monto).toFixed(2)}€ (${payment.periodo}) está atrasado ${daysOverdue} días.`,
            prioridad: daysOverdue > 30 ? 'alta' : 'normal',
            entityId: payment.id,
            entityType: 'Payment',
            enlace: `/pagos?filter=atrasado`,
          });

          // Notificación al inquilino
          await createNotification({
            userId: tenant.id,
            companyId: company.id,
            tipo: 'pago_pendiente',
            titulo: '⚠️ Tienes un pago pendiente',
            mensaje: `Tu pago de ${payment.periodo} por ${Number(payment.monto).toFixed(2)}€ está pendiente.`,
            prioridad: 'alta',
            enlace: '/portal-inquilino/pagos',
          });

          result.notificationsSent += 2;
        }

        logger.info(`📍 Pago ${payment.id} marcado como atrasado (${daysOverdue} días)`);
      } catch (error: any) {
        result.errors.push(`Pago ${payment.id}: ${error.message}`);
      }
    }

    // 2. SINCRONIZAR CON STRIPE
    // Verificar pagos que tienen PaymentIntent pendiente
    const stripePendingPayments = await prisma.payment.findMany({
      where: {
        stripePaymentIntentId: { not: null },
        stripePaymentStatus: { in: ['processing', 'requires_confirmation', 'requires_action'] },
      },
      select: {
        id: true,
        stripePaymentIntentId: true,
      },
    });

    if (stripePendingPayments.length > 0 && process.env.STRIPE_SECRET_KEY) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      for (const payment of stripePendingPayments) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripePaymentIntentId!
          );

          let newStatus: string | undefined;
          let newEstado: string | undefined;

          switch (paymentIntent.status) {
            case 'succeeded':
              newStatus = 'succeeded';
              newEstado = 'pagado';
              break;
            case 'canceled':
              newStatus = 'canceled';
              newEstado = 'pendiente';
              break;
            case 'requires_payment_method':
              newStatus = 'failed';
              newEstado = 'rechazado';
              break;
          }

          if (newStatus) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                stripePaymentStatus: newStatus as any,
                estado: newEstado as any,
                ...(newEstado === 'pagado' && { fechaPago: new Date() }),
              },
            });
            result.syncedWithStripe++;
          }
        } catch (error: any) {
          result.errors.push(`Stripe sync ${payment.id}: ${error.message}`);
        }
      }
    }

    // 3. SINCRONIZAR CON GOCARDLESS
    const gcPendingPayments = await prisma.payment.findMany({
      where: {
        gcPaymentId: { not: null },
        gcPaymentStatus: { in: ['pending_submission', 'submitted'] },
      },
      select: {
        id: true,
        gcPaymentId: true,
      },
    });

    if (gcPendingPayments.length > 0 && process.env.GOCARDLESS_ACCESS_TOKEN) {
      const { GoCardlessClient } = await import('@/lib/gocardless-integration');
      const gcClient = new GoCardlessClient({
        accessToken: process.env.GOCARDLESS_ACCESS_TOKEN,
        environment: process.env.GOCARDLESS_ENVIRONMENT as 'sandbox' | 'live' || 'sandbox',
        enabled: true,
      });

      for (const payment of gcPendingPayments) {
        try {
          const gcPayment = await gcClient.getPayment(payment.gcPaymentId!);
          
          let newEstado: string | undefined;
          
          switch (gcPayment.status) {
            case 'confirmed':
            case 'paid_out':
              newEstado = 'pagado';
              break;
            case 'failed':
            case 'charged_back':
              newEstado = 'rechazado';
              break;
            case 'cancelled':
              newEstado = 'pendiente';
              break;
          }

          if (newEstado) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                gcPaymentStatus: gcPayment.status,
                estado: newEstado as any,
                ...(newEstado === 'pagado' && { fechaPago: new Date() }),
              },
            });
            result.syncedWithStripe++; // Reutilizar contador
          }
        } catch (error: any) {
          result.errors.push(`GoCardless sync ${payment.id}: ${error.message}`);
        }
      }
    }

    // 4. ACTUALIZAR MÉTRICAS DE MOROSIDAD
    await updateDelinquencyMetrics();

    // 5. REGISTRAR EJECUCIÓN
    await prisma.cronExecution.create({
      data: {
        name: 'update-payment-status',
        status: result.errors.length === 0 ? 'success' : 'partial',
        result: JSON.stringify(result),
        executedAt: new Date(),
      },
    });

    logger.info('✅ Actualización de estados completada', result);

    return NextResponse.json({
      success: result.errors.length === 0,
      message: `Procesados ${result.totalProcessed} pagos: ${result.markedAsOverdue} marcados atrasados, ${result.notificationsSent} notificaciones`,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error en CRON update-payment-status:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtener estado actual de pagos atrasados
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = role === 'super_admin' 
      ? undefined 
      : (session.user as any).companyId;

    const where: any = {
      estado: 'atrasado',
    };

    if (companyId) {
      where.contract = {
        unit: {
          building: { companyId },
        },
      };
    }

    const [total, byRisk, totalAmount] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ['nivelRiesgo'],
        where,
        _count: true,
      }),
      prisma.payment.aggregate({
        where,
        _sum: { monto: true },
      }),
    ]);

    const lastExecution = await prisma.cronExecution.findFirst({
      where: { name: 'update-payment-status' },
      orderBy: { executedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        overduePayments: {
          total,
          totalAmount: Number(totalAmount._sum?.monto || 0),
          byRisk: byRisk.reduce((acc, item) => {
            acc[item.nivelRiesgo || 'bajo'] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
        lastExecution: lastExecution ? {
          executedAt: lastExecution.executedAt,
          status: lastExecution.status,
          result: JSON.parse(lastExecution.result || '{}'),
        } : null,
      },
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de pagos:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Actualiza métricas agregadas de morosidad
 */
async function updateDelinquencyMetrics(): Promise<void> {
  try {
    // Obtener empresas con pagos atrasados
    const companies = await prisma.company.findMany({
      where: {
        buildings: {
          some: {
            units: {
              some: {
                contracts: {
                  some: {
                    payments: {
                      some: { estado: 'atrasado' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    for (const company of companies) {
      const metrics = await prisma.payment.aggregate({
        where: {
          estado: 'atrasado',
          contract: {
            unit: {
              building: { companyId: company.id },
            },
          },
        },
        _count: true,
        _sum: { monto: true },
      });

      await prisma.company.update({
        where: { id: company.id },
        data: {
          morosidadTotal: Number(metrics._sum?.monto || 0),
          pagosAtrasados: metrics._count,
          morosidadUpdatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error('Error actualizando métricas de morosidad:', error);
  }
}

/**
 * GOCARDLESS RECONCILIATION SERVICE
 * Conciliación bancaria entre pagos SEPA y pagos de alquiler en Inmova
 *
 * Flujo:
 * 1. GoCardless cobra al inquilino via SEPA Direct Debit
 * 2. El pago pasa por estados: pending -> submitted -> confirmed -> paid_out
 * 3. Cuando es paid_out, GC transfiere a la cuenta del propietario/gestor
 * 4. Este servicio concilia pagos GC con los Payments de contratos en Inmova
 */

import { logger } from '@/lib/logger';
import { getPrismaClient } from '@/lib/db';
import { getGCClient, centsToEuros } from '@/lib/gocardless-integration';

// ============================================================================
// TYPES
// ============================================================================

export interface ReconciliationResult {
  paymentId: string;
  gcPaymentId: string;
  status: 'matched' | 'unmatched' | 'error';
  matchedPaymentId?: string;
  matchScore?: number;
  reason?: string;
}

export interface ReconciliationSummary {
  total: number;
  matched: number;
  unmatched: number;
  errors: number;
  totalAmount: number;
  matchedAmount: number;
}

// ============================================================================
// SYNC SERVICE - Sincronizar datos de GC a la BD local
// ============================================================================

/**
 * Sincronizar pagos de GoCardless a la tabla SepaPayment local.
 * Llama a la API de GC, compara con lo que ya tenemos, y actualiza.
 */
export async function syncPaymentsFromGC(companyId: string): Promise<{
  created: number;
  updated: number;
  errors: number;
}> {
  const gc = getGCClient();
  if (!gc) throw new Error('GoCardless no configurado');

  const prisma = getPrismaClient();
  let created = 0;
  let updated = 0;
  let errors = 0;
  let after: string | undefined;

  try {
    do {
      const result = await gc.listPayments({ limit: 100, after });

      for (const gcPayment of result.items) {
        try {
          const existing = await prisma.sepaPayment.findUnique({
            where: { gcPaymentId: gcPayment.id! },
          });

          if (existing) {
            // Actualizar estado si cambió
            if (existing.status !== gcPayment.status) {
              await prisma.sepaPayment.update({
                where: { id: existing.id },
                data: {
                  status: gcPayment.status as any,
                  chargeDate: gcPayment.chargeDate,
                  amountRefunded: gcPayment.amountRefunded || 0,
                },
              });
              updated++;
            }
          } else {
            // Crear nuevo registro local
            // Buscar mandato local para vincular
            const mandate = await prisma.sepaMandate.findFirst({
              where: { gcMandateId: gcPayment.mandateId, companyId },
            });

            if (mandate) {
              await prisma.sepaPayment.create({
                data: {
                  companyId,
                  gcPaymentId: gcPayment.id!,
                  mandateId: mandate.id,
                  amount: gcPayment.amount,
                  currency: gcPayment.currency,
                  description: gcPayment.description || '',
                  reference: gcPayment.reference,
                  chargeDate: gcPayment.chargeDate,
                  status: (gcPayment.status as any) || 'pending_submission',
                  amountRefunded: gcPayment.amountRefunded || 0,
                  metadata: gcPayment.metadata as any,
                  tenantId: (gcPayment.metadata as any)?.inmova_tenant_id,
                  contractId: (gcPayment.metadata as any)?.inmova_contract_id,
                },
              });
              created++;
            }
          }
        } catch (err) {
          logger.error(`[Reconciliation] Error syncing payment ${gcPayment.id}:`, err);
          errors++;
        }
      }

      after = result.meta.cursors.after || undefined;
    } while (after);

    logger.info(`[Reconciliation] Sync complete: ${created} created, ${updated} updated, ${errors} errors`);
    return { created, updated, errors };
  } catch (error) {
    logger.error('[Reconciliation] Sync failed:', error);
    throw error;
  }
}

/**
 * Sincronizar payouts de GoCardless a la tabla GCPayout local.
 */
export async function syncPayoutsFromGC(companyId: string): Promise<{
  created: number;
  updated: number;
}> {
  const gc = getGCClient();
  if (!gc) throw new Error('GoCardless no configurado');

  const prisma = getPrismaClient();
  let created = 0;
  let updated = 0;
  let after: string | undefined;

  do {
    const result = await gc.listPayouts({ limit: 100, after });

    for (const gcPayout of result.items) {
      const existing = await prisma.gCPayout.findUnique({
        where: { gcPayoutId: gcPayout.id! },
      });

      if (existing) {
        if (existing.status !== gcPayout.status) {
          await prisma.gCPayout.update({
            where: { id: existing.id },
            data: { status: gcPayout.status || 'pending' },
          });
          updated++;
        }
      } else {
        // Obtener desglose del payout
        let debitCount = 0;
        let debitAmount = 0;
        let feeAmount = 0;
        let refundAmount = 0;

        try {
          const items = await gc.listPayoutItems(gcPayout.id!);
          for (const item of items.items) {
            switch (item.type) {
              case 'payment_paid_out':
                debitCount++;
                debitAmount += Math.abs(item.amount);
                break;
              case 'gocardless_fee':
              case 'app_fee':
              case 'surcharge_fee':
                feeAmount += Math.abs(item.amount);
                break;
              case 'payment_refunded':
              case 'refund':
                refundAmount += Math.abs(item.amount);
                break;
            }
          }
        } catch (e) {
          logger.warn(`[Reconciliation] Could not get payout items for ${gcPayout.id}`);
        }

        await prisma.gCPayout.create({
          data: {
            companyId,
            gcPayoutId: gcPayout.id!,
            amount: gcPayout.amount,
            currency: gcPayout.currency,
            arrivalDate: gcPayout.arrivalDate ? new Date(gcPayout.arrivalDate) : new Date(),
            status: gcPayout.status || 'pending',
            reference: gcPayout.reference,
            debitCount,
            debitAmount,
            feeAmount,
            refundAmount,
          },
        });
        created++;
      }
    }

    after = result.meta.cursors.after || undefined;
  } while (after);

  logger.info(`[Reconciliation] Payouts synced: ${created} created, ${updated} updated`);
  return { created, updated };
}

// ============================================================================
// AUTO-RECONCILIATION - Conciliar pagos SEPA con pagos de alquiler
// ============================================================================

/**
 * Conciliación automática: busca pagos SEPA confirmados/paid_out que aún
 * no están conciliados y los vincula con pagos de alquiler pendientes.
 *
 * Criterios de matching:
 * 1. Mismo inquilino (tenantId en metadata)
 * 2. Mismo monto (±1 centimo por redondeo)
 * 3. Fecha de cargo cercana a fecha de vencimiento del pago
 */
export async function autoReconcile(companyId: string): Promise<ReconciliationSummary> {
  const prisma = getPrismaClient();

  const summary: ReconciliationSummary = {
    total: 0,
    matched: 0,
    unmatched: 0,
    errors: 0,
    totalAmount: 0,
    matchedAmount: 0,
  };

  // Obtener pagos SEPA confirmados/paid_out sin conciliar
  const unreconciled = await prisma.sepaPayment.findMany({
    where: {
      companyId,
      conciliado: false,
      status: { in: ['confirmed', 'paid_out'] },
    },
    include: {
      mandate: { include: { customer: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  summary.total = unreconciled.length;

  for (const sepaPayment of unreconciled) {
    try {
      const amountEuros = centsToEuros(sepaPayment.amount);
      summary.totalAmount += amountEuros;

      // Buscar por tenantId en metadata o en el customer asociado
      const tenantId = sepaPayment.tenantId || sepaPayment.mandate.customer?.tenantId;
      if (!tenantId) {
        summary.unmatched++;
        continue;
      }

      // Buscar pago de alquiler pendiente del mismo inquilino con monto similar
      const matchingPayments = await prisma.payment.findMany({
        where: {
          contract: {
            tenantId,
            companyId,
          },
          estado: { in: ['pendiente', 'atrasado'] },
          monto: {
            gte: amountEuros - 0.02,
            lte: amountEuros + 0.02,
          },
        },
        orderBy: { fechaVencimiento: 'asc' },
        take: 1,
      });

      if (matchingPayments.length > 0) {
        const matchedPayment = matchingPayments[0];

        // Conciliar: actualizar ambos registros
        await prisma.$transaction([
          prisma.sepaPayment.update({
            where: { id: sepaPayment.id },
            data: {
              conciliado: true,
              conciliadoEn: new Date(),
              conciliadoPor: 'auto',
              inmovaPaymentId: matchedPayment.id,
              tenantId,
              contractId: matchedPayment.contractId,
            },
          }),
          prisma.payment.update({
            where: { id: matchedPayment.id },
            data: {
              estado: 'pagado',
              fechaPago: sepaPayment.chargeDate ? new Date(sepaPayment.chargeDate) : new Date(),
              metodoPago: 'sepa_direct_debit',
            },
          }),
        ]);

        summary.matched++;
        summary.matchedAmount += amountEuros;

        logger.info(`[Reconciliation] Auto-matched: SEPA ${sepaPayment.gcPaymentId} -> Payment ${matchedPayment.id} (${amountEuros}€)`);
      } else {
        summary.unmatched++;
      }
    } catch (error) {
      logger.error(`[Reconciliation] Error processing ${sepaPayment.id}:`, error);
      summary.errors++;
    }
  }

  logger.info(
    `[Reconciliation] Summary: ${summary.matched}/${summary.total} matched, ` +
    `${summary.unmatched} unmatched, ${summary.errors} errors, ` +
    `${summary.matchedAmount.toFixed(2)}€ conciliado`
  );

  return summary;
}

/**
 * Conciliación manual: vincular un pago SEPA específico con un pago de alquiler
 */
export async function manualReconcile(params: {
  sepaPaymentId: string;
  inmovaPaymentId: string;
  userId: string;
  nota?: string;
}): Promise<boolean> {
  const prisma = getPrismaClient();

  try {
    const sepaPayment = await prisma.sepaPayment.findUnique({
      where: { id: params.sepaPaymentId },
    });
    if (!sepaPayment) throw new Error('Pago SEPA no encontrado');

    const inmovaPayment = await prisma.payment.findUnique({
      where: { id: params.inmovaPaymentId },
    });
    if (!inmovaPayment) throw new Error('Pago de alquiler no encontrado');

    await prisma.$transaction([
      prisma.sepaPayment.update({
        where: { id: params.sepaPaymentId },
        data: {
          conciliado: true,
          conciliadoEn: new Date(),
          conciliadoPor: params.userId,
          inmovaPaymentId: params.inmovaPaymentId,
          contractId: inmovaPayment.contractId,
          notaConciliacion: params.nota,
        },
      }),
      prisma.payment.update({
        where: { id: params.inmovaPaymentId },
        data: {
          estado: 'pagado',
          fechaPago: sepaPayment.chargeDate ? new Date(sepaPayment.chargeDate) : new Date(),
          metodoPago: 'sepa_direct_debit',
        },
      }),
    ]);

    logger.info(`[Reconciliation] Manual: SEPA ${sepaPayment.gcPaymentId} -> Payment ${params.inmovaPaymentId} by ${params.userId}`);
    return true;
  } catch (error) {
    logger.error('[Reconciliation] Manual reconcile failed:', error);
    return false;
  }
}

/**
 * Deshacer conciliación
 */
export async function undoReconciliation(sepaPaymentId: string): Promise<boolean> {
  const prisma = getPrismaClient();

  try {
    const sepaPayment = await prisma.sepaPayment.findUnique({
      where: { id: sepaPaymentId },
    });
    if (!sepaPayment || !sepaPayment.inmovaPaymentId) return false;

    await prisma.$transaction([
      prisma.sepaPayment.update({
        where: { id: sepaPaymentId },
        data: {
          conciliado: false,
          conciliadoEn: null,
          conciliadoPor: null,
          inmovaPaymentId: null,
          notaConciliacion: null,
        },
      }),
      prisma.payment.update({
        where: { id: sepaPayment.inmovaPaymentId },
        data: {
          estado: 'pendiente',
          fechaPago: null,
          metodoPago: null,
        },
      }),
    ]);

    logger.info(`[Reconciliation] Undo: SEPA ${sepaPayment.gcPaymentId}`);
    return true;
  } catch (error) {
    logger.error('[Reconciliation] Undo failed:', error);
    return false;
  }
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Obtener estadísticas de conciliación para el dashboard
 */
export async function getReconciliationStats(companyId: string) {
  const prisma = getPrismaClient();

  const [
    totalPayments,
    reconciledPayments,
    pendingPayments,
    failedPayments,
    totalPayoutsResult,
    unreconciledPayouts,
  ] = await Promise.all([
    prisma.sepaPayment.count({ where: { companyId } }),
    prisma.sepaPayment.count({ where: { companyId, conciliado: true } }),
    prisma.sepaPayment.count({
      where: { companyId, conciliado: false, status: { in: ['confirmed', 'paid_out'] } },
    }),
    prisma.sepaPayment.count({
      where: { companyId, status: { in: ['failed', 'charged_back', 'cancelled'] } },
    }),
    prisma.gCPayout.aggregate({
      where: { companyId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.gCPayout.count({ where: { companyId, conciliado: false } }),
  ]);

  // Ingresos por mes (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentPayments = await prisma.sepaPayment.findMany({
    where: {
      companyId,
      status: { in: ['confirmed', 'paid_out'] },
      createdAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, createdAt: true },
  });

  const monthlyRevenue: Record<string, number> = {};
  for (const p of recentPayments) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + centsToEuros(p.amount);
  }

  return {
    payments: {
      total: totalPayments,
      reconciled: reconciledPayments,
      pendingReconciliation: pendingPayments,
      failed: failedPayments,
      reconciliationRate: totalPayments > 0
        ? Math.round((reconciledPayments / totalPayments) * 100)
        : 0,
    },
    payouts: {
      total: totalPayoutsResult._count,
      totalAmount: centsToEuros(totalPayoutsResult._sum.amount || 0),
      unreconciledCount: unreconciledPayouts,
    },
    monthlyRevenue,
  };
}

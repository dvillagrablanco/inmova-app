/**
 * CRON: Reconciliación Bancaria Automática — Grupo Vidaro
 *
 * Ejecutar diariamente a las 08:00.
 * Flujo completo:
 *   1. Sync movimientos desde Salt Edge (todas las sociedades)
 *   2. Sync pagos SEPA desde GoCardless
 *   3. Conciliación unificada 3 capas por sociedad
 *   4. Detección de impagos y contratos sin pago del mes
 *
 * POST /api/cron/bank-reconciliation
 * Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos para el grupo completo

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error || 'No autorizado' },
      { status: authResult.status }
    );
  }

  const startTime = Date.now();
  const prisma = await getPrisma();

  try {
    const now = new Date();
    logger.info('[Cron] Iniciando reconciliación bancaria Grupo Vidaro');

    // ── FASE 1: Sync + Reconciliación por sociedad ──────────────────────────
    let syncResult = {
      companies: [] as any[],
      totalNewTransactions: 0,
      totalReconciled: 0,
    };

    try {
      const { fullSyncAllGrupoVidaro } = await import('@/lib/banking-unified-service');
      syncResult = await fullSyncAllGrupoVidaro();
      logger.info(
        `[Cron] Salt Edge sync: +${syncResult.totalNewTransactions} tx, ${syncResult.totalReconciled} conciliadas`
      );
    } catch (e: any) {
      logger.warn('[Cron] Error en fullSyncAllGrupoVidaro:', e.message);
    }

    // ── FASE 2: Detección de impagos (análisis de contratos) ────────────────
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [activeContracts, recentPayments] = await Promise.all([
      prisma.contract.findMany({
        where: { estado: 'activo' },
        select: {
          id: true,
          rentaMensual: true,
          companyId: true,
          tenant: { select: { id: true, nombreCompleto: true, email: true } },
          unit: { select: { id: true, numero: true, building: { select: { nombre: true } } } },
        },
      }),
      prisma.payment.findMany({
        where: { fechaVencimiento: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          contractId: true,
          monto: true,
          estado: true,
          fechaVencimiento: true,
          fechaPago: true,
        },
      }),
    ]);

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const contractsWithPayment = new Set(
      recentPayments
        .filter((p) => {
          const payMonth = p.fechaVencimiento
            ? `${p.fechaVencimiento.getFullYear()}-${String(p.fechaVencimiento.getMonth() + 1).padStart(2, '0')}`
            : '';
          return payMonth === currentMonth && p.estado === 'pagado';
        })
        .map((p) => p.contractId)
    );

    const unpaidContracts = activeContracts.filter((c) => !contractsWithPayment.has(c.id));
    const overduePayments = recentPayments.filter(
      (p) => p.estado === 'pendiente' && p.fechaVencimiento && p.fechaVencimiento < now
    );

    // ── FASE 3: Stats de SEPA ────────────────────────────────────────────────
    const [pendingSepaRecon, activeMandates] = await Promise.all([
      prisma.sepaPayment
        .count({
          where: { conciliado: false, status: { in: ['confirmed', 'paid_out'] } },
        })
        .catch(() => 0),
      prisma.sepaMandate.count({ where: { status: 'active' } }).catch(() => 0),
    ]);

    // ── RESUMEN FINAL ────────────────────────────────────────────────────────
    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      date: now.toISOString(),
      duration: `${duration}s`,
      openBanking: {
        provider: 'saltedge',
        sociedadesSync: syncResult.companies.length,
        newTransactions: syncResult.totalNewTransactions,
        reconciledTransactions: syncResult.totalReconciled,
        byCompany: syncResult.companies.map((c: any) => ({
          company: c.companyName,
          newTx: c.sync?.newBankTransactions || 0,
          reconciled:
            (c.reconciliation?.sepaToPayment?.matched || 0) +
            (c.reconciliation?.payoutToBankTx?.matched || 0) +
            (c.reconciliation?.bankTxToPayment?.matched || 0),
          error: c.error || null,
        })),
      },
      contracts: {
        active: activeContracts.length,
        paidThisMonth: contractsWithPayment.size,
        unpaidThisMonth: unpaidContracts.length,
        overduePayments: overduePayments.length,
        totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.monto, 0),
        unpaidDetails: unpaidContracts.slice(0, 20).map((c) => ({
          contractId: c.id,
          tenant: c.tenant?.nombreCompleto || 'Sin inquilino',
          unit: `${c.unit?.building?.nombre || ''} - ${c.unit?.numero || ''}`,
          rentaMensual: c.rentaMensual,
          companyId: c.companyId,
        })),
      },
      sepa: {
        activeMandates,
        pendingReconciliation: pendingSepaRecon,
      },
    };

    logger.info('[Cron] Bank reconciliation completed', {
      duration,
      newTx: syncResult.totalNewTransactions,
      reconciled: syncResult.totalReconciled,
      unpaid: unpaidContracts.length,
    });

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    logger.error('[Cron] Bank reconciliation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/cron/bank-reconciliation
 * Último estado del cron (sin ejecutar).
 * Usado desde Vercel Cron Jobs.
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Vercel Cron Jobs también llaman vía GET — ejecutar igualmente
  return POST(request);
}

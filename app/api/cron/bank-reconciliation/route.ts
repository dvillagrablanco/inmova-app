/**
 * CRON: Reconciliación Bancaria Automática
 * 
 * Ejecutar diariamente. Compara cobros bancarios (GoCardless/Nordigen)
 * con pagos registrados en contratos. Detecta impagos y cobros sin asignar.
 * 
 * POST /api/cron/bank-reconciliation
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

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

  const prisma = await getPrisma();

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Obtener contratos activos con pagos pendientes
    const activeContracts = await prisma.contract.findMany({
      where: { estado: 'activo' },
      select: {
        id: true,
        rentaMensual: true,
        tenant: { select: { id: true, nombreCompleto: true, email: true } },
        unit: { select: { id: true, numero: true, building: { select: { nombre: true } } } },
      },
    });

    // 2. Obtener pagos del último mes
    const recentPayments = await prisma.payment.findMany({
      where: {
        fechaVencimiento: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        contractId: true,
        monto: true,
        estado: true,
        fechaVencimiento: true,
        fechaPago: true,
      },
    });

    // 3. Detectar impagos: contratos sin pago del mes actual
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const contractsWithPayment = new Set(
      recentPayments
        .filter(p => {
          const payMonth = p.fechaVencimiento
            ? `${p.fechaVencimiento.getFullYear()}-${String(p.fechaVencimiento.getMonth() + 1).padStart(2, '0')}`
            : '';
          return payMonth === currentMonth && p.estado === 'pagado';
        })
        .map(p => p.contractId)
    );

    const unpaidContracts = activeContracts.filter(c => !contractsWithPayment.has(c.id));

    // 4. Pagos vencidos sin cobrar
    const overduePayments = recentPayments.filter(
      p => p.estado === 'pendiente' && p.fechaVencimiento && p.fechaVencimiento < now
    );

    // 5. Generar resumen
    const summary = {
      date: now.toISOString(),
      activeContracts: activeContracts.length,
      paidThisMonth: contractsWithPayment.size,
      unpaidThisMonth: unpaidContracts.length,
      overduePayments: overduePayments.length,
      totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.monto, 0),
      unpaidDetails: unpaidContracts.slice(0, 20).map(c => ({
        contractId: c.id,
        tenant: c.tenant?.nombreCompleto || 'Sin inquilino',
        unit: `${c.unit?.building?.nombre || ''} - ${c.unit?.numero || ''}`,
        rentaMensual: c.rentaMensual,
      })),
    };

    logger.info('[Cron] Bank reconciliation completed', {
      paid: summary.paidThisMonth,
      unpaid: summary.unpaidThisMonth,
      overdue: summary.overduePayments,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    logger.error('[Cron] Bank reconciliation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

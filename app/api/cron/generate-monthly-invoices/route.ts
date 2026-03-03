/**
 * CRON: Generate Monthly Invoices
 *
 * Creates Payment records for all active contracts that don't have
 * an invoice/payment for the current month.
 *
 * POST /api/cron/generate-monthly-invoices
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
    return NextResponse.json({ error: authResult.error ?? 'No autorizado' }, { status: authResult.status });
  }

  const prisma = await getPrisma();

  try {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeContracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        rentaMensual: { gt: 0 },
        isDemo: false,
        unit: { building: { isDemo: false } },
      },
      select: {
        id: true,
        rentaMensual: true,
        diaPago: true,
      },
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const contract of activeContracts) {
      const existing = await prisma.payment.findFirst({
        where: {
          contractId: contract.id,
          periodo: currentPeriod,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const fechaVencimiento = new Date(
        now.getFullYear(),
        now.getMonth(),
        Math.min(contract.diaPago ?? 1, 28)
      );

      try {
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            periodo: currentPeriod,
            monto: contract.rentaMensual,
            fechaVencimiento,
            estado: 'pendiente',
            concepto: `Renta ${currentPeriod}`,
          },
        });
        created++;
      } catch (err) {
        logger.error('[Cron] Error creating payment for contract', { contractId: contract.id, error: err });
        errors++;
      }
    }

    const summary = { created, skipped, errors, total: activeContracts.length };
    logger.info('[Cron] Generate monthly invoices completed', summary);

    return NextResponse.json({
      success: true,
      period: currentPeriod,
      summary,
    });
  } catch (error: unknown) {
    logger.error('[Cron] Generate monthly invoices error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

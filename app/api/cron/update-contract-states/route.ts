import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireCronSecret } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  try {
    const prisma = await getPrisma();
    const now = new Date();

    const toExpire = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: { lt: now },
        isDemo: false,
      },
      select: { id: true, unitId: true },
    });

    if (toExpire.length === 0) {
      logger.info('[Cron update-contract-states] 0 contratos marcados como vencidos');
      return NextResponse.json({
        success: true,
        contractsExpired: 0,
        timestamp: now.toISOString(),
      });
    }

    const expired = await prisma.contract.updateMany({
      where: {
        id: { in: toExpire.map((c) => c.id) },
      },
      data: { estado: 'vencido' },
    });

    const unitIds = [...new Set(toExpire.map((c) => c.unitId))];
    if (unitIds.length > 0) {
      await prisma.unit.updateMany({
        where: {
          id: { in: unitIds },
          estado: 'ocupada',
        },
        data: {
          estado: 'disponible',
          tenantId: null,
        },
      });
    }

    logger.info(`[Cron update-contract-states] ${expired.count} contratos marcados como vencidos`);

    return NextResponse.json({
      success: true,
      contractsExpired: expired.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[Cron update-contract-states] Error:', error);
    return NextResponse.json({ error: 'Error actualizando contratos' }, { status: 500 });
  }
}

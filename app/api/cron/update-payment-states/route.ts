import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  // SECURITY (auditoría 2026-04-16): este cron escribe en la tabla de pagos.
  // Sin auth, cualquiera podía forzar la actualización masiva de estados.
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error ?? 'No autorizado' },
      { status: authResult.status }
    );
  }

  try {
    const prisma = await getPrisma();
    const now = new Date();

    const result = await prisma.payment.updateMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: { lt: now },
        fechaPago: null,
        isDemo: false,
      },
      data: { estado: 'atrasado' },
    });

    logger.info(`[Cron update-payment-states] ${result.count} pagos marcados como atrasados`);

    return NextResponse.json({
      success: true,
      updated: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[Cron update-payment-states] Error:', error);
    return NextResponse.json({ error: 'Error actualizando estados' }, { status: 500 });
  }
}

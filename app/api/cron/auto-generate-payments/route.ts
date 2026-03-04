import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/auto-generate-payments
 * Verifica que todos los contratos activos tienen pago generado para el mes actual.
 * Crea pagos faltantes automáticamente.
 * Ejecutar el día 1 de cada mes.
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const mesLabel = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const periodo = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

    // Find active contracts
    const activeContracts = await prisma.contract.findMany({
      where: {
        estado: 'activo',
        fechaFin: { gte: now },
      },
      select: {
        id: true,
        rentaMensual: true,
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true, building: { select: { nombre: true, companyId: true } } } },
      },
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const contract of activeContracts) {
      try {
        // Check if payment already exists for this month
        const existing = await prisma.payment.findFirst({
          where: {
            contractId: contract.id,
            fechaVencimiento: { gte: monthStart, lte: monthEnd },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create payment for this month
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            periodo,
            monto: Number(contract.rentaMensual) || 0,
            fechaVencimiento: startOfMonth(addMonths(now, 0)), // 1st of current month
            estado: 'pendiente',
          },
        });
        created++;
      } catch (err) {
        errors++;
        logger.error(`[Auto-Generate] Error for contract ${contract.id}:`, err);
      }
    }

    logger.info('[Auto-Generate Payments]', {
      month: periodo,
      activeContracts: activeContracts.length,
      created,
      skipped,
      errors,
    });

    return NextResponse.json({
      success: true,
      month: periodo,
      activeContracts: activeContracts.length,
      created,
      skipped,
      errors,
    });
  } catch (error: any) {
    logger.error('[Auto-Generate Payments Error]:', error);
    return NextResponse.json({ error: 'Error generando pagos' }, { status: 500 });
  }
}

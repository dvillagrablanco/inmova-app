import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/cron/annual-depreciation
 * Regenera las tablas de amortización de TODOS los activos.
 * Ejecutar anualmente (1 de enero) o bajo demanda.
 * Protegido por CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const { generateDepreciationTable } = await import('@/lib/investment-service');

    // Obtener todos los activos
    const assets = await prisma.assetAcquisition.findMany({
      select: { id: true, companyId: true },
    });

    let updated = 0;
    let errors = 0;

    for (const asset of assets) {
      try {
        await generateDepreciationTable(asset.id);
        updated++;
      } catch (err: any) {
        logger.error(`[Annual Depreciation] Error for asset ${asset.id}:`, err);
        errors++;
      }
    }

    logger.info(`[Annual Depreciation] Completed: ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: true,
      processed: assets.length,
      updated,
      errors,
    });
  } catch (error: any) {
    logger.error('[Annual Depreciation] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

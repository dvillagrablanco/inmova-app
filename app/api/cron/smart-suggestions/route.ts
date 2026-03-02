export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runSmartAnalysis } from '@/lib/smart-suggestions-service';
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/smart-suggestions
 * Cron diario: analiza todas las empresas activas y genera sugerencias
 */
export async function GET(request: NextRequest) {
  // Verify cron secret or allow manual trigger
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without secret for manual testing
    const url = new URL(request.url);
    if (!url.searchParams.get('manual')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const prisma = await getPrisma();

    // Get all active non-test companies
    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true },
    });

    const results: Array<{ company: string; created: number; skipped: number }> = [];

    for (const company of companies) {
      try {
        const result = await runSmartAnalysis(company.id);
        results.push({ company: company.nombre, ...result });
      } catch (err) {
        logger.error(`[SmartSuggestions] Error analyzing ${company.nombre}:`, err);
        results.push({ company: company.nombre, created: 0, skipped: 0 });
      }
    }

    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    logger.info(`[SmartSuggestions Cron] Completed: ${totalCreated} new suggestions`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      companies: results.length,
      totalCreated,
      details: results,
    });
  } catch (error: unknown) {
    logger.error('[SmartSuggestions Cron]:', error);
    return NextResponse.json({ error: 'Error en análisis' }, { status: 500 });
  }
}

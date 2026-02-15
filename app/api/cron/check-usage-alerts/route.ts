/**
 * API Route: Cron Job - Check Usage Alerts
 * GET /api/cron/check-usage-alerts
 * 
 * Ejecutar diariamente para verificar límites y enviar alertas
 * 
 * Setup con cron (vercel.json o servidor):
 * 0 9 * * * curl https://inmovaapp.com/api/cron/check-usage-alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimitsForAllCompanies } from '@/lib/usage-alerts-service';

import logger from '@/lib/logger';
import { requireCronSecret } from '@/lib/api-auth-guard';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos

/**
 * GET /api/cron/check-usage-alerts
 * 
 * Verifica límites de todas las empresas y envía alertas
 */
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  try {
    // Verificar cron secret (seguridad)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('[Cron] Starting usage alerts check...');
    
    await checkUsageLimitsForAllCompanies();
    
    logger.info('[Cron] Usage alerts check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Usage alerts checked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('[Cron] Error checking usage alerts:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

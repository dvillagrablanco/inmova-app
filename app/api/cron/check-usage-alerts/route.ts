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
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos

/**
 * GET /api/cron/check-usage-alerts
 * 
 * Verifica límites de todas las empresas y envía alertas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar cron secret (seguridad)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting usage alerts check...');
    
    await checkUsageLimitsForAllCompanies();
    
    console.log('[Cron] Usage alerts check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Usage alerts checked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Cron] Error checking usage alerts:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

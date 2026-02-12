/**
 * API Route: Cron Job - Process Monthly Overages
 * GET /api/cron/process-monthly-overages
 * 
 * Ejecutar el día 1 de cada mes a las 2 AM para facturar excesos
 * 
 * Setup con cron (vercel.json o servidor):
 * 0 2 1 * * curl https://inmovaapp.com/api/cron/process-monthly-overages
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMonthlyOverages } from '@/lib/usage-billing-service';

import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutos

/**
 * GET /api/cron/process-monthly-overages
 * 
 * Procesa facturación de excesos para todas las empresas
 */
export async function GET(request: NextRequest) {
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

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

    logger.info('[Cron] Starting monthly overage processing...');
    
    const result = await processMonthlyOverages();
    
    logger.info('[Cron] Monthly overage processing completed');
    
    return NextResponse.json({
      success: result.success,
      invoicesCreated: result.invoicesCreated,
      totalAmount: result.totalAmount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('[Cron] Error processing monthly overages:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

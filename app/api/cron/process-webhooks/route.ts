import { requireCronSecret } from '@/lib/api-auth-guard';
/**
 * API Cron Job: Procesar Webhooks Pendientes
 * 
 * Este endpoint debe ser llamado periódicamente (cada 1-5 minutos)
 * por un servicio cron externo
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvents } from '@/lib/webhook-service';
import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/cron/process-webhooks
 */
export async function POST(req: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(req as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  try {
    // Verificar token de seguridad
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    logger.info('[CRON] Iniciando procesamiento de webhooks...');

    const result = await processWebhookEvents();

    logger.info('[CRON] Procesamiento de webhooks completado', result);

    return NextResponse.json({
      success: true,
      message: 'Webhooks procesados exitosamente',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CRON] Error procesando webhooks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-webhooks
 */
export async function GET(req: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(req as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  return NextResponse.json({
    service: 'Webhook Processor',
    status: 'online',
    timestamp: new Date().toISOString(),
    info: 'Use POST para ejecutar el procesamiento de webhooks',
  });
}

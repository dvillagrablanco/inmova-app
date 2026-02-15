import { requireCronSecret } from '@/lib/api-auth-guard';
/**
 * API Cron Job: Procesar Emails Programados
 * 
 * Este endpoint debe ser llamado periódicamente (cada 5-15 minutos)
 * por un servicio cron externo como:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - cron-job.org
 * - Node-cron interno
 * 
 * Procesa emails que están programados y cuya fecha ya ha llegado
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledEmails } from '@/lib/onboarding-email-service';
import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos máximo de ejecución

/**
 * POST /api/cron/process-scheduled-emails
 * 
 * Seguridad: Se recomienda proteger este endpoint con un token secreto
 * para evitar ejecuciones no autorizadas
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
    // Verificar token de seguridad (opcional pero recomendado)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    logger.info('[CRON] Iniciando procesamiento de emails programados...');

    const result = await processScheduledEmails();

    logger.info('[CRON] Procesamiento completado', result);

    return NextResponse.json({
      success: true,
      message: 'Emails procesados exitosamente',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CRON] Error procesando emails programados:', error);
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
 * GET /api/cron/process-scheduled-emails
 * 
 * Endpoint de health check para verificar que el servicio está funcionando
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
    service: 'Email Scheduler',
    status: 'online',
    timestamp: new Date().toISOString(),
    info: 'Use POST para ejecutar el procesamiento de emails',
  });
}

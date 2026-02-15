export const dynamic = 'force-dynamic';

/**
 * CRON JOB: Automatización de Onboarding
 * 
 * Ejecuta tareas automáticas de onboarding:
 * - Envía reminders a usuarios inactivos
 * - Procesa webhooks fallidos
 * - Detecta abandono
 * - Genera analytics
 * 
 * Configurar en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/onboarding-automation",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processOnboardingReminders } from '@/lib/onboarding-email-automation';
import { retryFailedWebhooks } from '@/lib/onboarding-webhook-system';
import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireCronSecret } from '@/lib/api-auth-guard';

// Proteger con token de autenticación
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  try {
    // Verificar autorización
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
    
    logger.info('[CRON_ONBOARDING] Starting automation tasks...');
    
    // Ejecutar tareas en paralelo
    const results = await Promise.allSettled([
      processOnboardingReminders(),
      retryFailedWebhooks()
    ]);
    
    // Verificar resultados
    const errors = results
      .filter(r => r.status === 'rejected')
      .map((r) =>
        r.status === 'rejected'
          ? (r.reason instanceof Error ? r.reason.message : 'Unknown error')
          : 'Unknown error'
      );
    
    if (errors.length > 0) {
      logger.error('[CRON_ONBOARDING] Some tasks failed:', errors);
      return NextResponse.json({
        success: false,
        message: 'Some tasks failed',
        errors
      }, { status: 500 });
    }
    
    logger.info('[CRON_ONBOARDING] All tasks completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Onboarding automation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error('[CRON_ONBOARDING] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Permitir POST también (para testing manual)
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  // Cron auth guard (auditoria V2)
  const cronAuth = await authorizeCronRequest(request as any);
  if (!cronAuth.authorized) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  return GET(request);
}

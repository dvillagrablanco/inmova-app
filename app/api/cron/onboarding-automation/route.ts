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

// Proteger con token de autenticación
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.API_SECRET_KEY;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[CRON_ONBOARDING] Starting automation tasks...');

    // Ejecutar tareas en paralelo
    const results = await Promise.allSettled([processOnboardingReminders(), retryFailedWebhooks()]);

    // Verificar resultados
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r: any) => r.reason?.message || 'Unknown error');

    if (errors.length > 0) {
      logger.error('[CRON_ONBOARDING] Some tasks failed:', errors);
      return NextResponse.json(
        {
          success: false,
          message: 'Some tasks failed',
          errors,
        },
        { status: 500 }
      );
    }

    logger.info('[CRON_ONBOARDING] All tasks completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Onboarding automation completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CRON_ONBOARDING] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Permitir POST también (para testing manual)
export async function POST(request: NextRequest) {
  return GET(request);
}

export const dynamic = 'force-dynamic';

/**
 * API: GET /api/cron/process-email-triggers
 * Cron job para procesar emails programados que deben enviarse
 *
 * Ejecutar cada 10 minutos via cron externo o Vercel Cron:
 * Expresión cron: (asterisco)/10 * * * * (cada 10 minutos)
 */

import { NextResponse } from 'next/server';
import { processScheduledEmails } from '@/lib/email-triggers-service';
import logger from '@/lib/logger';

export async function GET() {
  try {
    logger.info('[CRON process-email-triggers] Starting...');

    // Validar que viene desde un cron job (opcional: usar token secreto)
    // const authHeader = process.env.CRON_SECRET;
    // if (request.headers.get('authorization') !== `Bearer ${authHeader}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await processScheduledEmails();

    logger.info('[CRON process-email-triggers] Completed:', result);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CRON process-email-triggers] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

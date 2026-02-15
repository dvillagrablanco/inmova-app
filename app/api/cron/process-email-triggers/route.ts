export const dynamic = 'force-dynamic';

/**
 * API: GET /api/cron/process-email-triggers
 * Cron job para procesar emails programados que deben enviarse
 * 
 * Ejecutar cada 10 minutos via cron externo o Vercel Cron:
 * Expresión cron: (asterisco)/10 * * * * (cada 10 minutos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledEmails } from '@/lib/email-triggers-service';

import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireCronSecret } from '@/lib/api-auth-guard';

export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  try {
    const authResult = await authorizeCronRequest(request, { allowSession: false });
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'No autorizado' },
        { status: authResult.status }
      );
    }

    const result = await processScheduledEmails();

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

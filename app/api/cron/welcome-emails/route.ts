/**
 * GET /api/cron/welcome-emails
 * Ejecuta la secuencia de emails de bienvenida para nuevos usuarios.
 * Se ejecuta diariamente via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWelcomeSequence } from '@/lib/welcome-email-sequence';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret — no fallback, no bypass
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  try {
    const result = await processWelcomeSequence();
    logger.info(`[Cron WelcomeEmails] Processed: ${result.sent} sent, ${result.errors} errors`);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Cron WelcomeEmails] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/cron/welcome-emails
 * Ejecuta la secuencia de emails de bienvenida para nuevos usuarios.
 * Se ejecuta diariamente via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWelcomeSequence } from '@/lib/welcome-email-sequence';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || 'inmova-cron-2026';

  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processWelcomeSequence();
    logger.info(`[Cron WelcomeEmails] Processed: ${result.sent} sent, ${result.errors} errors`);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Cron WelcomeEmails] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

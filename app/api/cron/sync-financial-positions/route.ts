/**
 * CRON: Sync Financial Positions
 *
 * Stub for syncing financial positions from external sources (Pictet PDFs, etc.).
 * Currently logs that manual import is required and returns status.
 *
 * POST /api/cron/sync-financial-positions
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error ?? 'No autorizado' }, { status: authResult.status });
  }

  logger.info('[Cron] Sync financial positions: manual import required');

  return NextResponse.json({
    success: true,
    status: 'manual_import_required',
    message: 'Sincronización automática no implementada. Use importación manual (Pictet PDF, SWIFT MT940/MT535, etc.) desde el panel de Family Office.',
  });
}

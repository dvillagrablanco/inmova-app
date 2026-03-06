/**
 * GET /api/open-banking/tink/callback
 * Callback de Tink Link tras autorización bancaria
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const credentialsId = searchParams.get('credentials_id');
  const error = searchParams.get('error');

  if (error) {
    logger.warn('[Tink Callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/banca?tink=error&message=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (credentialsId) {
    logger.info('[Tink Callback] Success, credentials:', credentialsId);
    return NextResponse.redirect(
      new URL(`/dashboard/banca?tink=success&credentials=${credentialsId}`, req.url)
    );
  }

  return NextResponse.redirect(new URL('/dashboard/banca?tink=unknown', req.url));
}

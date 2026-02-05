import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/referrals
 * Implementación mínima para evitar 404.
 */
export async function GET() {
  return NextResponse.json([]);
}

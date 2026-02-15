import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/addons/sync-stripe
 * Stripe subscription sync disabled - module removed in cleanup.
 * Re-enable when stripe-subscription-service is reimplemented.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe sync temporarily unavailable' },
    { status: 503 }
  );
}

import { NextRequest } from 'next/server';
import { POST as canonicalPOST } from '@/app/api/gocardless/subscriptions/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/subscribe delega en /api/gocardless/subscriptions
 */
export async function POST(request: NextRequest) {
  return canonicalPOST(request);
}

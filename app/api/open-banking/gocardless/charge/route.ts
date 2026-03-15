import { NextRequest } from 'next/server';
import { POST as canonicalPOST } from '@/app/api/gocardless/payments/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/charge delega en /api/gocardless/payments
 */
export async function POST(request: NextRequest) {
  return canonicalPOST(request);
}

import { NextRequest } from 'next/server';
import { POST as canonicalPOST } from '@/app/api/gocardless/webhook/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/webhook delega en /api/gocardless/webhook
 */
export async function POST(request: NextRequest) {
  return canonicalPOST(request);
}

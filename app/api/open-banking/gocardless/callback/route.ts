import { NextRequest } from 'next/server';
import { GET as canonicalGET } from '@/app/api/gocardless/callback/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/callback delega en /api/gocardless/callback
 */
export async function GET(request: NextRequest) {
  return canonicalGET(request);
}

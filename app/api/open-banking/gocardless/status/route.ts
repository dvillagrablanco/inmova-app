import { NextRequest } from 'next/server';
import { GET as canonicalGET } from '@/app/api/gocardless/stats/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/status delega en /api/gocardless/stats
 */
export async function GET(request: NextRequest) {
  return canonicalGET(request);
}

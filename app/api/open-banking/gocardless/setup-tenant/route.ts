import { NextRequest } from 'next/server';
import { POST as canonicalPOST } from '@/app/api/gocardless/setup-tenant/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibilidad legacy:
 * /api/open-banking/gocardless/setup-tenant delega en /api/gocardless/setup-tenant
 */
export async function POST(request: NextRequest) {
  return canonicalPOST(request);
}

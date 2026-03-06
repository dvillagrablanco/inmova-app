/**
 * GET /api/open-banking/tink/accounts
 * Lista cuentas bancarias conectadas vía Tink
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { isTinkConfigured, listAccounts } = await import('@/lib/tink-service');
    if (!isTinkConfigured()) {
      return NextResponse.json({ error: 'Tink no configurado' }, { status: 503 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    const tinkUserId = `inmova_${companyId}_${userId}`;

    const accounts = await listAccounts(tinkUserId);

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    logger.error('[Tink Accounts]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

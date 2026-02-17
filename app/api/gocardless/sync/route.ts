import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncPaymentsFromGC, syncPayoutsFromGC } from '@/lib/gocardless-reconciliation';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/gocardless/sync
 * Sincronizar datos de GoCardless a la BD local
 * Body: { type: 'payments' | 'payouts' | 'all' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { type = 'all' } = await request.json();
    const results: any = {};

    if (type === 'payments' || type === 'all') {
      results.payments = await syncPaymentsFromGC(session.user.companyId);
    }

    if (type === 'payouts' || type === 'all') {
      results.payouts = await syncPayoutsFromGC(session.user.companyId);
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Sincronización completada',
    });
  } catch (error: any) {
    logger.error('[GC Sync]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

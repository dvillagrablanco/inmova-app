import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGCClient } from '@/lib/gocardless-integration';
import { getReconciliationStats } from '@/lib/gocardless-reconciliation';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/gocardless/stats
 * Estadísticas de GoCardless: creditor, mandatos, pagos, conciliación
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const gc = getGCClient();
    const configured = !!gc;
    const env = process.env.GOCARDLESS_ENVIRONMENT || 'live';

    let creditor = null;
    if (gc) {
      try {
        creditor = await gc.getCreditor();
      } catch (e) {
        logger.warn('[GC Stats] Could not fetch creditor info');
      }
    }

    const reconciliation = configured
      ? await getReconciliationStats(session.user.companyId)
      : null;

    return NextResponse.json({
      success: true,
      gocardless: {
        configured,
        environment: env,
        creditor,
      },
      reconciliation,
    });
  } catch (error: any) {
    logger.error('[GC Stats]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSaltEdgeConfigured, syncSaltEdgeTransactions } from '@/lib/saltedge-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/saltedge/sync
 *
 * Sincroniza movimientos bancarios desde Salt Edge.
 * Body: { companyId?: string }
 * Retorna: { newTransactions, updatedTransactions, connections }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSaltEdgeConfigured()) {
      return NextResponse.json({ error: 'Salt Edge no configurado' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const companyId: string = body.companyId || session.user.companyId;

    const result = await syncSaltEdgeTransactions(companyId);

    logger.info(
      `[SaltEdge Sync] company ${companyId}: +${result.newTransactions} nuevas, ${result.updatedTransactions} actualizadas`
    );

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.newTransactions} nuevas transacciones, ${result.updatedTransactions} actualizadas de ${result.connections} conexión(es)`,
    });
  } catch (error: any) {
    logger.error('[SaltEdge Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

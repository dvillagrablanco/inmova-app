import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  isEnableBankingConfigured,
  syncEnableBankingTransactions,
} from '@/lib/enablebanking-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/enablebanking/sync
 * Sincroniza movimientos bancarios desde Enable Banking.
 * Body: { companyId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isEnableBankingConfigured()) {
      return NextResponse.json({ error: 'Enable Banking no configurado' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const companyId: string = body.companyId || session.user.companyId;

    const result = await syncEnableBankingTransactions(companyId);

    logger.info(
      `[EnableBanking Sync] company ${companyId}: +${result.newTransactions} nuevas, ${result.updatedTransactions} actualizadas`
    );

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.newTransactions} nuevas transacciones, ${result.updatedTransactions} actualizadas`,
    });
  } catch (error: any) {
    logger.error('[EnableBanking Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

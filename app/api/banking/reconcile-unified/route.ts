import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  unifiedReconcile,
  fullSyncAndReconcile,
  getCompanyBankingStatus,
  getAllCompanyBankingStatus,
} from '@/lib/banking-unified-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/banking/reconcile-unified
 * Estado bancario de las sociedades (Viroda, Rovida)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      const statuses = await getAllCompanyBankingStatus();
      return NextResponse.json({ success: true, companies: statuses });
    }

    const status = await getCompanyBankingStatus(session.user.companyId);
    return NextResponse.json({ success: true, company: status });
  } catch (error: any) {
    logger.error('[Banking Unified GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/banking/reconcile-unified
 * Ejecutar conciliación unificada (GC + Bankinter + Pagos)
 *
 * Body:
 * - { action: 'reconcile' }    → Conciliación 3 capas sin sync
 * - { action: 'full-sync' }    → Sync desde GC + conciliación completa
 * - { action: 'status' }       → Status detallado
 * - { companyId?: string }     → Opcional: sociedad específica (default: session)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, companyId: targetCompanyId } = body;

    // Resolver scope de empresa
    const { resolveAccountingScope } = await import('@/lib/accounting-scope');
    const scope = await resolveAccountingScope(request, session.user as any);
    const companyId = targetCompanyId || scope?.activeCompanyId || (session.user as any).companyId;

    switch (action) {
      case 'reconcile': {
        const result = await unifiedReconcile(companyId);
        const totalMatched =
          result.sepaToPayment.matched +
          result.payoutToBankTx.matched +
          result.bankTxToPayment.matched;

        return NextResponse.json({
          success: true,
          action: 'reconcile',
          result,
          message: `Conciliación unificada: ${totalMatched} registros conciliados`,
        });
      }

      case 'full-sync': {
        const result = await fullSyncAndReconcile(companyId);
        const totalMatched =
          result.reconciliation.sepaToPayment.matched +
          result.reconciliation.payoutToBankTx.matched +
          result.reconciliation.bankTxToPayment.matched;

        return NextResponse.json({
          success: true,
          action: 'full-sync',
          sync: result.sync,
          reconciliation: result.reconciliation,
          message: `Sync: ${result.sync.payments} pagos, ${result.sync.payouts} payouts. Conciliación: ${totalMatched} registros.`,
        });
      }

      case 'status': {
        const status = await getCompanyBankingStatus(companyId);
        return NextResponse.json({ success: true, company: status });
      }

      default:
        return NextResponse.json(
          { error: 'action debe ser reconcile, full-sync o status' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('[Banking Unified POST]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

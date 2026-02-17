import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { identifyPaymentSource, smartReconcileBatch } from '@/lib/ai-reconciliation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/banking/smart-reconcile
 *
 * Conciliación inteligente con IA.
 *
 * Body:
 * - { action: 'batch' }
 *     Procesa hasta 100 transacciones pendientes, identifica inquilino+unidad
 *     por reglas + IA, y concilia automáticamente si confidence >= 70%.
 *
 * - { action: 'identify', description, amount, debtorName?, reference? }
 *     Identifica un movimiento individual sin conciliar.
 *
 * - { action: 'batch', useAI: false }
 *     Solo reglas, sin llamar a Claude (más rápido).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, useAI = true } = body;

    switch (action) {
      case 'batch': {
        const batchLimit = Math.min(body.limit || 30, 50);
        const result = await smartReconcileBatch(
          session.user.companyId,
          batchLimit,
          useAI
        );

        return NextResponse.json({
          success: true,
          ...result,
          message: `Procesados ${result.processed} movimientos: ${result.reconciled} conciliados, ${result.matched} identificados` +
            (result.aiCalls > 0 ? ` (${result.aiCalls} análisis IA).` : '.'),
        });
      }

      case 'identify': {
        const { description, amount, debtorName, reference } = body;
        if (!description || amount === undefined) {
          return NextResponse.json(
            { error: 'description y amount requeridos' },
            { status: 400 }
          );
        }

        const match = await identifyPaymentSource(
          session.user.companyId,
          description,
          amount,
          debtorName || null,
          reference || null,
          useAI
        );

        return NextResponse.json({ success: true, match });
      }

      default:
        return NextResponse.json(
          { error: 'action debe ser batch o identify' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('[Smart Reconcile]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

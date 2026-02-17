import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  autoReconcile,
  manualReconcile,
  undoReconciliation,
} from '@/lib/gocardless-reconciliation';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/gocardless/reconcile
 * Ejecutar conciliación
 * Body:
 * - { action: 'auto' }  -> conciliación automática
 * - { action: 'manual', sepaPaymentId, inmovaPaymentId, nota? } -> conciliación manual
 * - { action: 'undo', sepaPaymentId } -> deshacer conciliación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'auto': {
        const summary = await autoReconcile(session.user.companyId);
        return NextResponse.json({
          success: true,
          action: 'auto',
          summary,
          message: `Conciliación automática: ${summary.matched}/${summary.total} pagos conciliados (${summary.matchedAmount.toFixed(2)}€)`,
        });
      }

      case 'manual': {
        const { sepaPaymentId, inmovaPaymentId, nota } = body;
        if (!sepaPaymentId || !inmovaPaymentId) {
          return NextResponse.json(
            { error: 'sepaPaymentId e inmovaPaymentId requeridos' },
            { status: 400 }
          );
        }

        const success = await manualReconcile({
          sepaPaymentId,
          inmovaPaymentId,
          userId: session.user.id || 'unknown',
          nota,
        });

        return NextResponse.json({
          success,
          action: 'manual',
          message: success ? 'Pago conciliado correctamente' : 'Error al conciliar',
        });
      }

      case 'undo': {
        const { sepaPaymentId: undoId } = body;
        if (!undoId) {
          return NextResponse.json({ error: 'sepaPaymentId requerido' }, { status: 400 });
        }

        const success = await undoReconciliation(undoId);
        return NextResponse.json({
          success,
          action: 'undo',
          message: success ? 'Conciliación deshecha' : 'Error al deshacer',
        });
      }

      default:
        return NextResponse.json(
          { error: 'action debe ser auto, manual o undo' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('[GC Reconcile]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { identifyPaymentSource, smartReconcileBatch } from '@/lib/ai-reconciliation-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, useAI = true } = body;

    switch (action) {
      // Contar ingresos pendientes (para barra de progreso)
      case 'count': {
        const prisma = getPrismaClient();
        const count = await prisma.bankTransaction.count({
          where: {
            companyId: session.user.companyId,
            estado: 'pendiente_revision',
            monto: { gt: 0 },
          },
        });
        return NextResponse.json({ success: true, count });
      }

      // Procesar un mini-batch
      case 'batch': {
        const batchLimit = Math.min(body.limit || 10, 50);
        const result = await smartReconcileBatch(
          session.user.companyId,
          batchLimit,
          useAI
        );

        return NextResponse.json({
          success: true,
          ...result,
          message: `${result.reconciled} conciliados, ${result.matched} identificados`,
        });
      }

      // Identificar un movimiento individual
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
          { error: 'action debe ser batch, count o identify' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('[Smart Reconcile]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

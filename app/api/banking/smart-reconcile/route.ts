import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { identifyPaymentSource, smartReconcileBatch } from '@/lib/ai-reconciliation-service';
import { getPrismaClient } from '@/lib/db';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, useAI = true } = body;

    // Resolver scope de empresa (soporta selector de empresa, holdings, super_admin)
    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    // Usar la empresa activa (o la primera del scope)
    const companyId = scope.activeCompanyId;

    switch (action) {
      case 'count': {
        const prisma = getPrismaClient();
        const count = await prisma.bankTransaction.count({
          where: {
            companyId: { in: scope.companyIds },
            estado: 'pendiente_revision',
            monto: { gt: 0 },
          },
        });
        return NextResponse.json({ success: true, count });
      }

      case 'batch': {
        const batchLimit = Math.min(body.limit || 10, 50);

        // Procesar para cada empresa del scope
        let totalProcessed = 0;
        let totalMatched = 0;
        let totalReconciled = 0;
        let totalAiCalls = 0;
        let allResults: any[] = [];

        for (const cid of scope.companyIds) {
          const result = await smartReconcileBatch(cid, batchLimit, useAI);
          totalProcessed += result.processed;
          totalMatched += result.matched;
          totalReconciled += result.reconciled;
          totalAiCalls += result.aiCalls;
          allResults = allResults.concat(result.results);
        }

        return NextResponse.json({
          success: true,
          processed: totalProcessed,
          matched: totalMatched,
          reconciled: totalReconciled,
          aiCalls: totalAiCalls,
          results: allResults,
          message: `${totalReconciled} conciliados, ${totalMatched} identificados`,
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
          companyId,
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

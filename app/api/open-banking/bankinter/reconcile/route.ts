import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { conciliarPagos } from '@/lib/open-banking-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/bankinter/reconcile
 * Ejecuta conciliación automática con movimientos Bankinter.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { mesesAtras = 1 } = await request.json().catch(() => ({}));
    const result = await conciliarPagos(companyId, mesesAtras);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Bankinter Reconcile]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

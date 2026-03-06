/**
 * GET /api/operator-signatures/stats
 * Estadísticas de firmas de operadores
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOperatorSignatureStats, KNOWN_OPERATORS } from '@/lib/operator-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const stats = await getOperatorSignatureStats(companyId);

    return NextResponse.json({
      success: true,
      ...stats,
      knownOperators: KNOWN_OPERATORS,
    });
  } catch (error: any) {
    logger.error('[OperatorSignatures Stats]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/operator-signatures/[id]
 * Detalle de una solicitud de firma de operador
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOperatorSignatureRequest } from '@/lib/operator-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const result = await getOperatorSignatureRequest(params.id, companyId);
    if (!result) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('[OperatorSignatures Detail]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

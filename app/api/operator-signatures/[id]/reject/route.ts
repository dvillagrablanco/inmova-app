/**
 * PUT /api/operator-signatures/[id]/reject
 * Rechaza una solicitud de firma de operador
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { rejectOperatorSignatureRequest } from '@/lib/operator-signature-service';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Motivo de rechazo requerido'),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const body = rejectSchema.parse(await req.json());

    const result = await rejectOperatorSignatureRequest(
      params.id,
      companyId,
      userId,
      body.reason
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[OperatorSignatures Reject]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

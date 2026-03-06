/**
 * PUT /api/operator-signatures/[id]/approve
 * Aprueba una solicitud de firma de operador y envía a DocuSign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { approveOperatorSignatureRequest } from '@/lib/operator-signature-service';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const approveSchema = z.object({
  reviewNotes: z.string().optional(),
  provider: z.enum(['DOCUSIGN', 'SIGNATURIT']).optional(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
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

    const body = approveSchema.parse(await req.json());

    const result = await approveOperatorSignatureRequest(
      params.id,
      companyId,
      {
        reviewedBy: userId,
        ...body,
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[OperatorSignatures Approve]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

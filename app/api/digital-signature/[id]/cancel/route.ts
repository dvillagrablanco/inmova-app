import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import * as SignaturitService from '@/lib/signaturit-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no encontrado' }, { status: 400 });
    }

    const documento = await prisma.documentoFirma.findFirst({
      where: { id: params.id, companyId },
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (documento.estado !== 'PENDING') {
      return NextResponse.json({ error: 'El documento no está pendiente' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;

    if (documento.signaturitId && SignaturitService.isSignaturitConfigured()) {
      await SignaturitService.cancelSignature(documento.signaturitId);
    }

    await prisma.documentoFirma.update({
      where: { id: documento.id },
      data: {
        estado: 'CANCELLED',
        canceladoEn: new Date(),
        canceladoPor: session.user.id,
        motivoCancelacion: reason,
      },
    });

    await prisma.firmante.updateMany({
      where: { documentoId: documento.id, estado: 'pendiente' },
      data: { estado: 'rechazado', rechazadoEn: new Date() },
    });

    if (documento.contractId) {
      await prisma.contractSignature.updateMany({
        where: {
          contractId: documento.contractId,
          externalId: documento.signaturitId || undefined,
          status: { in: ['PENDING'] },
        },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[digital-signature] Error canceling document:', error);
    return NextResponse.json({ error: 'Error cancelando documento' }, { status: 500 });
  }
}

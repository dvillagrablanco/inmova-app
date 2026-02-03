import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import * as SignaturitService from '@/lib/signaturit-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
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

    if (!documento.signaturitId) {
      return NextResponse.json({ error: 'Documento sin firma asociada' }, { status: 400 });
    }

    if (!SignaturitService.isSignaturitConfigured()) {
      return NextResponse.json({ error: 'Servicio de firma no configurado' }, { status: 503 });
    }

    await SignaturitService.sendReminder(documento.signaturitId);

    await prisma.firmante.updateMany({
      where: { documentoId: documento.id, estado: 'pendiente' },
      data: {
        recordatoriosEnviados: { increment: 1 },
        ultimoRecordatorio: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[digital-signature] Error sending reminder:', error);
    return NextResponse.json({ error: 'Error enviando recordatorio' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const { id } = params;

    const documento = await prisma.documentoFirma.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const now = new Date();
    const motivo = body?.motivo || 'Cancelado por el usuario';

    await prisma.documentoFirma.update({
      where: { id },
      data: {
        estado: 'CANCELLED',
        canceladoEn: now,
        canceladoPor: session.user.id,
        motivoCancelacion: motivo,
      },
    });

    await prisma.firmante.updateMany({
      where: {
        documentoId: id,
        estado: {
          in: ['pendiente', 'visto'],
        },
      },
      data: {
        estado: 'rechazado',
        rechazadoEn: now,
        motivoRechazo: motivo,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud de firma cancelada correctamente',
    });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error canceling document'), {
      context: 'POST /api/admin/firma-digital/documentos/[id]/cancel',
      documentId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ error: 'Error al cancelar documento' }, { status: 500 });
  }
}

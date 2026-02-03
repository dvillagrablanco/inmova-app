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
    const result = await prisma.firmante.updateMany({
      where: {
        documentoId: id,
        estado: {
          in: ['pendiente', 'visto'],
        },
      },
      data: {
        recordatoriosEnviados: { increment: 1 },
        ultimoRecordatorio: now,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message:
        result.count > 0
          ? 'Recordatorio enviado a firmantes pendientes'
          : 'No hay firmantes pendientes para recordar',
    });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error sending reminder'), {
      context: 'POST /api/admin/firma-digital/documentos/[id]/reminder',
      documentId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ error: 'Error al enviar recordatorio' }, { status: 500 });
  }
}

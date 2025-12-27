import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { cancelarSolicitudFirma } from '@/lib/digital-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/digital-signature/[id]/cancel
 * Cancela una solicitud de firma digital
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para cancelar solicitudes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { motivo = 'Cancelado por el usuario' } = body;

    const documento = await prisma.documentoFirma.findUnique({
      where: { id: params.id }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (documento.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // No permitir cancelar documentos ya completados
    if (documento.estado === 'firmado') {
      return NextResponse.json(
        { error: 'No se puede cancelar un documento ya firmado' },
        { status: 400 }
      );
    }

    const result = await cancelarSolicitudFirma(params.id, motivo);

    logger.info(`🚫 Documento de firma cancelado: ${params.id} - Motivo: ${motivo}`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error cancelando solicitud de firma:', error);
    return NextResponse.json(
      { error: 'Error cancelando solicitud de firma' },
      { status: 500 }
    );
  }
}

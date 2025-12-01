import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { obtenerEstadoDocumento, cancelarSolicitudFirma, reenviarInvitacion } from '@/lib/digital-signature-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/digital-signature/[id]
 * Obtiene el estado detallado de un documento de firma
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el documento pertenece a la empresa del usuario
    const documento = await prisma.documentoFirma.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const estado = await obtenerEstadoDocumento(id);
    return NextResponse.json(estado);
  } catch (error) {
    console.error('Error obteniendo estado del documento:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado del documento' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/digital-signature/[id]
 * Actualiza o cancela un documento de firma
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { accion, firmanteId, motivo } = body;

    // Verificar que el documento pertenece a la empresa del usuario
    const documento = await prisma.documentoFirma.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Manejar diferentes acciones
    if (accion === 'cancelar') {
      if (!['administrador', 'gestor'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'No tiene permisos para cancelar solicitudes' },
          { status: 403 }
        );
      }

      const result = await cancelarSolicitudFirma(id, motivo || 'Cancelado por el administrador');
      return NextResponse.json(result);
    }

    if (accion === 'reenviar' && firmanteId) {
      if (!['administrador', 'gestor'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'No tiene permisos para reenviar invitaciones' },
          { status: 403 }
        );
      }

      const result = await reenviarInvitacion(id, firmanteId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error actualizando documento:', error);
    return NextResponse.json(
      { error: 'Error actualizando documento' },
      { status: 500 }
    );
  }
}

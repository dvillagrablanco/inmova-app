import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { obtenerEstadoDocumento } from '@/lib/digital-signature-service';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

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

    const result = await obtenerEstadoDocumento(params.id);

    // Verificar que el documento pertenece a la compañía del usuario
    if (result.documento.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error obteniendo estado de documento:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado del documento' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/digital-signature/[id]
 * Actualiza un documento de firma digital
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

    // Solo administradores y gestores
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar documentos de firma' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Verificar que el documento existe y pertenece a la compañía
    const existingDoc = await prisma.documentoFirma.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos permitidos
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.tipoDocumento !== undefined) updateData.tipoDocumento = body.tipoDocumento;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.fechaExpiracion !== undefined) updateData.fechaExpiracion = body.fechaExpiracion ? new Date(body.fechaExpiracion) : null;
    if (body.mensaje !== undefined) updateData.mensaje = body.mensaje;

    const documento = await prisma.documentoFirma.update({
      where: { id: params.id },
      data: updateData,
      include: {
        firmantes: true,
        tenant: true,
        contract: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      },
    });

    return NextResponse.json(documento);
  } catch (error) {
    logger.error('Error actualizando documento:', error);
    return NextResponse.json(
      { error: 'Error actualizando documento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/digital-signature/[id]
 * Elimina un documento de firma digital
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo administradores y gestores
    if (!['administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tiene permisos para eliminar documentos de firma' },
        { status: 403 }
      );
    }

    // Verificar que el documento existe y pertenece a la compañía
    const existingDoc = await prisma.documentoFirma.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar documentos completados o en proceso de firma
    if (['completado', 'firmando'].includes(existingDoc.estado)) {
      return NextResponse.json(
        { error: 'No se puede eliminar un documento completado o en proceso de firma' },
        { status: 400 }
      );
    }

    await prisma.documentoFirma.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Documento eliminado correctamente' });
  } catch (error) {
    logger.error('Error eliminando documento:', error);
    return NextResponse.json(
      { error: 'Error eliminando documento' },
      { status: 500 }
    );
  }
}

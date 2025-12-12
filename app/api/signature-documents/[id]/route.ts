export const dynamic = 'force-dynamic';

/**
 * API Route: /api/signature-documents/[id]
 * 
 * GET: Obtiene detalles de un documento específico
 * PUT: Actualiza un documento
 * DELETE: Elimina un documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const documentoId = params.id;

    const documento = await prisma.documentoFirma.findUnique({
      where: {
        id: documentoId,
        companyId: session.user.companyId
      },
      include: {
        firmantes: {
          orderBy: { orden: 'asc' }
        },
        template: {
          select: {
            nombre: true
          }
        },
        auditLog: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(documento);
  } catch (error: any) {
    logError(error, { message: '[API] Error al obtener documento' });
    return NextResponse.json(
      { error: 'Error al obtener documento', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const documentoId = params.id;

    // Verificar que el documento existe y pertenece a la compañía
    const documento = await prisma.documentoFirma.findUnique({
      where: {
        id: documentoId,
        companyId: session.user.companyId
      }
    });

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Solo permitir eliminar borradores
    if (documento.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar documentos en borrador' },
        { status: 400 }
      );
    }

    // Eliminar documento y sus relaciones (cascade configurado en schema)
    await prisma.documentoFirma.delete({
      where: { id: documentoId }
    });

    logger.info('[API] Documento eliminado', { documentoId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logError(error, { message: '[API] Error al eliminar documento' });
    return NextResponse.json(
      { error: 'Error al eliminar documento', details: error.message },
      { status: 500 }
    );
  }
}

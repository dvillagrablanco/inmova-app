import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();

    const {
      titulo,
      descripcion,
      tipoDocumento,
      requiereOrden,
      diasExpiracion,
      recordatorios,
      diasRecordatorio,
      firmantes,
    } = body;

    // Verificar que el documento pertenece a la empresa del usuario
    const existingDocumento = await prisma.documentoFirma.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingDocumento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // No permitir editar documentos ya firmados
    if (existingDocumento.estado === 'SIGNED') {
      return NextResponse.json(
        { error: 'No se puede editar un documento ya firmado' },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de expiración
    const fechaExpiracion = addDays(new Date(), parseInt(diasExpiracion) || 30);

    // Eliminar firmantes existentes y crear nuevos
    await prisma.firmante.deleteMany({
      where: { documentoId: id },
    });

    const documento = await prisma.documentoFirma.update({
      where: { id },
      data: {
        titulo,
        descripcion: descripcion || null,
        tipoDocumento,
        requiereOrden,
        diasExpiracion: parseInt(diasExpiracion),
        fechaExpiracion,
        recordatorios,
        diasRecordatorio: parseInt(diasRecordatorio),
        firmantes: {
          create: firmantes.map((firmante: any) => ({
            nombre: firmante.nombre,
            email: firmante.email,
            telefono: firmante.telefono || null,
            rol: firmante.rol,
            orden: firmante.orden,
            estado: 'pendiente',
          })),
        },
      },
      include: {
        firmantes: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    return NextResponse.json(documento);
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error updating document'), {
      context: 'PUT /api/admin/firma-digital/documentos/[id]',
      documentId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ error: 'Error al actualizar documento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verificar que el documento pertenece a la empresa del usuario
    const existingDocumento = await prisma.documentoFirma.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingDocumento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Eliminar firmantes primero (aunque con onDelete: Cascade debería ser automático)
    await prisma.firmante.deleteMany({
      where: { documentoId: id },
    });

    // Eliminar el documento
    await prisma.documentoFirma.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error deleting document'), {
      context: 'DELETE /api/admin/firma-digital/documentos/[id]',
      documentId: params?.id,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const { id } = params;
    const body = await req.json();
    const {
      nombre,
      categoria,
      descripcion,
      contenido,
      variables,
      jurisdiccion,
      aplicableA,
      activo
    } = body;
    // Verificar que la plantilla pertenece a la empresa del usuario
    const existingTemplate = await prisma.legalTemplate.findFirst({
      where: {
        id,
        companyId: session?.user?.companyId
      }
    });
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }
    const template = await prisma.legalTemplate.update({
      where: { id },
      data: {
        nombre,
        categoria,
        descripcion: descripcion || null,
        contenido,
        variables: Array.isArray(variables) ? variables : [],
        jurisdiccion: jurisdiccion || null,
        aplicableA: Array.isArray(aplicableA) ? aplicableA : [],
        activo,
        ultimaRevision: new Date()
      }
    });
    return NextResponse.json(template);
  } catch (error) {
    logger.error('Error al actualizar plantilla:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const { id } = params;
    await prisma.legalTemplate.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Plantilla eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar plantilla:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/legal/templates/[id] - Obtener plantilla específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const template = await prisma.legalTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    logger.error('Error fetching legal template:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantilla legal' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal/templates/[id] - Actualizar plantilla
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    // Verificar que la plantilla existe y pertenece a la compañía
    const existingTemplate = await prisma.legalTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos proporcionados
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.contenido !== undefined) updateData.contenido = body.contenido;
    if (body.variables !== undefined) updateData.variables = body.variables;
    if (body.jurisdiccion !== undefined) updateData.jurisdiccion = body.jurisdiccion;
    if (body.aplicableA !== undefined) updateData.aplicableA = body.aplicableA;
    if (body.activo !== undefined) updateData.activo = body.activo;
    if (body.ultimaRevision !== undefined) updateData.ultimaRevision = body.ultimaRevision ? new Date(body.ultimaRevision) : null;

    const template = await prisma.legalTemplate.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    logger.error('Error updating legal template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla legal' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal/templates/[id] - Eliminar plantilla
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que la plantilla existe y pertenece a la compañía
    const existingTemplate = await prisma.legalTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    await prisma.legalTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Plantilla eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting legal template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla legal' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener plantilla por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const template = await prisma.legalTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Usuarios normales solo pueden ver plantillas activas
    if (!template.activo && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    logger.error('Error fetching legal template:', error);
    return NextResponse.json(
      { error: 'Error al obtener la plantilla' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plantilla
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const allowedRoles = ['super_admin', 'administrador', 'gestor'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar plantillas' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const template = await prisma.legalTemplate.update({
      where: { id: params.id },
      data: {
        ...body,
        ultimaRevision: new Date(),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    logger.error('Error updating legal template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la plantilla' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const allowedRoles = ['super_admin', 'administrador'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar plantillas' },
        { status: 403 }
      );
    }

    await prisma.legalTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting legal template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la plantilla' },
      { status: 500 }
    );
  }
}

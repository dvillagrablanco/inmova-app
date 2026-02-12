import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener checklist específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const checklist = await prisma.sTRHousekeepingChecklist.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist no encontrada' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    logger.error('Error al obtener checklist:', error);
    return NextResponse.json(
      { error: 'Error al obtener checklist' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar checklist
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que la checklist pertenece a la compañía
    const existingChecklist = await prisma.sTRHousekeepingChecklist.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Checklist no encontrada' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.tiempoEstimado !== undefined) updateData.tiempoEstimado = body.tiempoEstimado;
    if (body.activa !== undefined) updateData.activa = body.activa;

    const checklist = await prisma.sTRHousekeepingChecklist.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(checklist);
  } catch (error) {
    logger.error('Error al actualizar checklist:', error);
    return NextResponse.json(
      { error: 'Error al actualizar checklist' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar checklist
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la checklist pertenece a la compañía
    const existingChecklist = await prisma.sTRHousekeepingChecklist.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Checklist no encontrada' }, { status: 404 });
    }

    await prisma.sTRHousekeepingChecklist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Checklist eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar checklist:', error);
    return NextResponse.json(
      { error: 'Error al eliminar checklist' },
      { status: 500 }
    );
  }
}

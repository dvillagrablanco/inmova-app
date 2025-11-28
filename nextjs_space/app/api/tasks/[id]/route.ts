import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        companyId,
      },
      include: {
        asignadoUser: {
          select: { id: true, name: true, email: true },
        },
        creadorUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error fetching task:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const body = await request.json();
    const {
      titulo,
      descripcion,
      estado,
      prioridad,
      fechaLimite,
      fechaInicio,
      asignadoA,
      notas,
    } = body;

    // Verify task belongs to company
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (estado !== undefined) {
      updateData.estado = estado;
      if (estado === 'completada' && !existingTask.fechaCompletada) {
        updateData.fechaCompletada = new Date();
      }
    }
    if (prioridad !== undefined) updateData.prioridad = prioridad;
    if (fechaLimite !== undefined) {
      updateData.fechaLimite = fechaLimite ? new Date(fechaLimite) : null;
    }
    if (fechaInicio !== undefined) {
      updateData.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    }
    if (asignadoA !== undefined) updateData.asignadoA = asignadoA;
    if (notas !== undefined) updateData.notas = notas;

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        asignadoUser: {
          select: { id: true, name: true, email: true },
        },
        creadorUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Verify task belongs to company
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

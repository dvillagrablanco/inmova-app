import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const tasks = await prisma.task.findMany({
      where: { companyId },
      include: {
        asignadoUser: {
          select: { id: true, name: true, email: true },
        },
        creadorUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { prioridad: 'desc' },
        { fechaLimite: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    logger.error('Error fetching tasks:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;
    const userId = user.id;

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

    if (!titulo) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        companyId,
        titulo,
        descripcion,
        estado: estado || 'pendiente',
        prioridad: prioridad || 'media',
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        asignadoA,
        creadoPor: userId,
        notas,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating task:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

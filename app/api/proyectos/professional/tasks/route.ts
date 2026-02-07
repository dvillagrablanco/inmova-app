import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = {
  companyId?: string;
};

const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json(
        { error: 'ID del proyecto es requerido' },
        { status: 400 }
      );
    }

    const project = await prisma.professionalProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const delivered = parsed.data.status === 'completada';

    const task = await prisma.professionalDeliverable.create({
      data: {
        projectId: project.id,
        nombre: parsed.data.name,
        descripcion: parsed.data.description,
        fechaLimite: new Date(parsed.data.endDate),
        entregado: delivered,
        fechaEntrega: delivered ? new Date() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task.id,
          name: task.nombre,
          description: task.descripcion || undefined,
          startDate: new Date(parsed.data.startDate).toISOString().split('T')[0],
          endDate: task.fechaLimite.toISOString().split('T')[0],
          progress: task.entregado ? 100 : 0,
          status: task.entregado ? 'completada' : 'pendiente',
          priority: 'media',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Professional Task Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 });
    }

    const project = await prisma.professionalProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.professionalDeliverable.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.nombre = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.descripcion = parsed.data.description;
    if (parsed.data.endDate) updateData.fechaLimite = new Date(parsed.data.endDate);

    if (parsed.data.status) {
      const delivered = parsed.data.status === 'completada';
      updateData.entregado = delivered;
      updateData.fechaEntrega = delivered ? new Date() : null;
    }

    await prisma.professionalDeliverable.update({
      where: { id: task.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error) {
    logger.error('[Professional Task Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 });
    }

    const project = await prisma.professionalProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.professionalDeliverable.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    await prisma.professionalDeliverable.delete({ where: { id: task.id } });

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error) {
    logger.error('[Professional Task Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

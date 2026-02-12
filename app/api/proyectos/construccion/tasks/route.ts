import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type SessionUser = {
  companyId?: string;
};

const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
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

    const project = await prisma.constructionProject.findFirst({
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

    const task = await prisma.constructionWorkOrder.create({
      data: {
        projectId: project.id,
        fase: project.faseActual,
        titulo: parsed.data.name,
        descripcion: parsed.data.description,
        subcontratista: parsed.data.assignee || 'Sin asignar',
        presupuesto: parsed.data.estimatedCost ?? 0,
        costoReal: parsed.data.actualCost ?? undefined,
        fechaInicio: new Date(parsed.data.startDate),
        fechaFin: new Date(parsed.data.endDate),
        estado: parsed.data.status || 'pendiente',
        porcentajeAvance: parsed.data.progress ?? 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task.id,
          name: task.titulo,
          description: task.descripcion,
          startDate: task.fechaInicio.toISOString().split('T')[0],
          endDate: task.fechaFin.toISOString().split('T')[0],
          progress: task.porcentajeAvance,
          status: task.estado,
          priority: parsed.data.priority || 'media',
          assignee: task.subcontratista,
          estimatedCost: task.presupuesto,
          actualCost: task.costoReal || undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Task Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const prisma = await getPrisma();
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
      return NextResponse.json(
        { error: 'IDs de proyecto y tarea son requeridos' },
        { status: 400 }
      );
    }

    const project = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.constructionWorkOrder.findFirst({
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
    if (parsed.data.name) updateData.titulo = parsed.data.name;
    if (parsed.data.description) updateData.descripcion = parsed.data.description;
    if (parsed.data.startDate) updateData.fechaInicio = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.fechaFin = new Date(parsed.data.endDate);
    if (parsed.data.status) updateData.estado = parsed.data.status;
    if (parsed.data.assignee !== undefined) updateData.subcontratista = parsed.data.assignee;
    if (parsed.data.estimatedCost !== undefined) updateData.presupuesto = parsed.data.estimatedCost;
    if (parsed.data.actualCost !== undefined) updateData.costoReal = parsed.data.actualCost;
    if (parsed.data.progress !== undefined) updateData.porcentajeAvance = parsed.data.progress;

    await prisma.constructionWorkOrder.update({
      where: { id: task.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error) {
    logger.error('[Task Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = await getPrisma();
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
      return NextResponse.json(
        { error: 'IDs de proyecto y tarea son requeridos' },
        { status: 400 }
      );
    }

    const project = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.constructionWorkOrder.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    await prisma.constructionWorkOrder.delete({ where: { id: task.id } });

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error) {
    logger.error('[Task Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

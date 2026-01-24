import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const taskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['pendiente', 'en_progreso', 'completada', 'retrasada', 'cancelada']).optional(),
  priority: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
  assignee: z.string().optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
});

type TaskInput = z.infer<typeof taskSchema>;

const mapTaskStatus = (status: string) => {
  const allowed = ['pendiente', 'en_progreso', 'completada', 'retrasada', 'cancelada'];
  if (allowed.includes(status)) return status;
  return 'pendiente';
};

/**
 * POST /api/proyectos/construccion/tasks
 * Crear una tarea en un proyecto
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    const body = (await request.json()) as TaskInput;
    const validationResult = taskSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const project = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const data = validationResult.data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Fechas invalidas' }, { status: 400 });
    }

    const task = await prisma.constructionWorkOrder.create({
      data: {
        projectId,
        fase: 'PLANIFICACION',
        titulo: data.name,
        descripcion: data.description || '',
        subcontratista: data.assignee || 'Pendiente',
        presupuesto: data.estimatedCost || 0,
        costoReal: data.actualCost || null,
        fechaInicio: startDate,
        fechaFin: endDate,
        estado: mapTaskStatus(data.status || 'pendiente'),
        porcentajeAvance: data.progress || 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task.id,
          name: task.titulo,
          description: task.descripcion,
          startDate: task.fechaInicio.toISOString(),
          endDate: task.fechaFin.toISOString(),
          progress: task.porcentajeAvance,
          status: task.estado,
          priority: data.priority || 'media',
          assignee: task.subcontratista,
          estimatedCost: task.presupuesto,
          actualCost: task.costoReal ?? undefined,
        },
        message: 'Tarea creada correctamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[Task Create Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proyectos/construccion/tasks
 * Actualizar una tarea
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission('update');
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs de proyecto y tarea son requeridos' }, { status: 400 });
    }

    const project = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<TaskInput>;
    const updateData: {
      titulo?: string;
      descripcion?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      estado?: string;
      porcentajeAvance?: number;
      subcontratista?: string;
      presupuesto?: number;
      costoReal?: number | null;
    } = {};

    if (body.name) updateData.titulo = body.name;
    if (body.description !== undefined) updateData.descripcion = body.description;
    if (body.startDate) {
      const startDate = new Date(body.startDate);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Fecha inicio invalida' }, { status: 400 });
      }
      updateData.fechaInicio = startDate;
    }
    if (body.endDate) {
      const endDate = new Date(body.endDate);
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Fecha fin invalida' }, { status: 400 });
      }
      updateData.fechaFin = endDate;
    }
    if (body.status) updateData.estado = mapTaskStatus(body.status);
    if (typeof body.progress === 'number') updateData.porcentajeAvance = body.progress;
    if (body.assignee) updateData.subcontratista = body.assignee;
    if (typeof body.estimatedCost === 'number') updateData.presupuesto = body.estimatedCost;
    if (typeof body.actualCost === 'number') updateData.costoReal = body.actualCost;

    await prisma.constructionWorkOrder.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error: any) {
    logger.error('[Task Update Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proyectos/construccion/tasks
 * Eliminar una tarea
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission('delete');
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs de proyecto y tarea son requeridos' }, { status: 400 });
    }

    const project = await prisma.constructionProject.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    await prisma.constructionWorkOrder.delete({ where: { id: taskId } });

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error: any) {
    logger.error('[Task Delete Error]:', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

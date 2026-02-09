import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import type { RenovationCategory } from '@prisma/client';

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
  progress: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  category: z.string().optional(),
  assignee: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const RENOVATION_CATEGORIES = new Set<RenovationCategory>([
  'ESTRUCTURAL',
  'FONTANERIA',
  'ELECTRICIDAD',
  'PINTURA',
  'SUELOS',
  'COCINA',
  'BANOS',
  'EXTERIORES',
  'OTROS',
]);

function mapStatusToCompletion(status: string | undefined, progress: number): boolean {
  if (status === 'completada') {
    return true;
  }
  return progress >= 100;
}

function normalizeCategory(value: string | undefined): RenovationCategory {
  if (!value) {
    return 'OTROS';
  }
  const upper = value.toUpperCase();
  return RENOVATION_CATEGORIES.has(upper as RenovationCategory)
    ? (upper as RenovationCategory)
    : 'OTROS';
}

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

    const project = await prisma.flippingProject.findFirst({
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
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const progress = parsed.data.progress ?? 0;

    const task = await prisma.flippingRenovation.create({
      data: {
        projectId: project.id,
        categoria: normalizeCategory(parsed.data.category),
        descripcion: parsed.data.name,
        presupuestado: parsed.data.estimatedCost ?? 0,
        costoReal: parsed.data.actualCost ?? undefined,
        proveedorNombre: parsed.data.assignee,
        fechaInicio: new Date(parsed.data.startDate),
        fechaFin: new Date(parsed.data.endDate),
        completado: mapStatusToCompletion(parsed.data.status, progress),
        porcentajeAvance: progress,
        notas: parsed.data.description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task.id,
          name: task.descripcion,
          description: task.notas || undefined,
          startDate: task.fechaInicio?.toISOString().split('T')[0],
          endDate: task.fechaFin?.toISOString().split('T')[0],
          progress: task.porcentajeAvance,
          status: task.completado
            ? 'completada'
            : task.porcentajeAvance > 0
              ? 'en_progreso'
              : 'pendiente',
          priority: 'media',
          assignee: task.proveedorNombre || undefined,
          estimatedCost: task.presupuestado,
          actualCost: task.costoReal || undefined,
          category: task.categoria,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[Flipping Task Create Error]:', error);
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

    const project = await prisma.flippingProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.flippingRenovation.findFirst({
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
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const progress = parsed.data.progress ?? task.porcentajeAvance;

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.descripcion = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.notas = parsed.data.description;
    if (parsed.data.startDate) updateData.fechaInicio = new Date(parsed.data.startDate);
    if (parsed.data.endDate) updateData.fechaFin = new Date(parsed.data.endDate);
    if (parsed.data.estimatedCost !== undefined) updateData.presupuestado = parsed.data.estimatedCost;
    if (parsed.data.actualCost !== undefined) updateData.costoReal = parsed.data.actualCost;
    if (parsed.data.assignee !== undefined) updateData.proveedorNombre = parsed.data.assignee;
    if (parsed.data.category) updateData.categoria = normalizeCategory(parsed.data.category);
    if (parsed.data.progress !== undefined) updateData.porcentajeAvance = parsed.data.progress;
    updateData.completado = mapStatusToCompletion(parsed.data.status, progress);

    await prisma.flippingRenovation.update({
      where: { id: task.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error) {
    logger.error('[Flipping Task Update Error]:', error);
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

    const project = await prisma.flippingProject.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const task = await prisma.flippingRenovation.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    await prisma.flippingRenovation.delete({ where: { id: task.id } });

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error) {
    logger.error('[Flipping Task Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

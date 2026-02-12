/**
 * Endpoints API para Tareas
 * 
 * Implementa operaciones CRUD con validación Zod, manejo de errores
 * y códigos de estado HTTP correctos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { taskCreateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/tasks
 * Obtiene todas las tareas con filtros opcionales
 */
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const asignadoA = searchParams.get('asignadoA');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const where: any = { companyId: user.companyId };
    
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (asignadoA) where.asignadoA = asignadoA;

    // Paginación
    const take = limit ? parseInt(limit) : undefined;
    const skip = offset ? parseInt(offset) : undefined;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
        take,
        skip,
      }),
      prisma.task.count({ where }),
    ]);

    logger.info(`Tareas obtenidas: ${tasks.length} de ${total}`, { userId: user.id });
    
    return NextResponse.json({
      data: tasks,
      meta: {
        total,
        limit: take,
        offset: skip,
      },
    }, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error fetching tasks:', error);
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Crea una nueva tarea con validación Zod
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requirePermission('create');
    const body = await req.json();

    // Validación con Zod
    const validatedData = taskCreateSchema.parse(body);

    // Verificar que el usuario asignado pertenece a la compañía
    if (validatedData.asignadoA) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: validatedData.asignadoA },
      });

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'No encontrado', message: 'Usuario asignado no encontrado' },
          { status: 404 }
        );
      }

      if (assignedUser.companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No puede asignar tareas a usuarios de otra compañía' },
          { status: 403 }
        );
      }
    }

    const taskData: any = {
      ...validatedData,
      companyId: user.companyId,
      creadoPor: user.id,
    };

    if (validatedData.fechaLimite) {
      taskData.fechaLimite = new Date(validatedData.fechaLimite);
    }

    if (validatedData.fechaInicio) {
      taskData.fechaInicio = new Date(validatedData.fechaInicio);
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        asignadoUser: {
          select: { id: true, name: true, email: true },
        },
        creadorUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Tarea creada: ${task.id}`, { userId: user.id, taskId: task.id });
    return NextResponse.json(task, { status: 201 });
    
  } catch (error: any) {
    logger.error('Error creating task:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: 'Prohibido', message: error.message },
        { status: 403 }
      );
    }
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

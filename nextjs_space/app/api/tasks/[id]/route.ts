/**
 * Endpoints API para operaciones específicas de Tareas
 * 
 * Implementa operaciones GET, PUT y DELETE con validación Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { taskUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/[id]
 * Obtiene una tarea específica con sus relaciones
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: params.id },
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
        { error: 'No encontrado', message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la tarea pertenece a la compañía del usuario
    if (task.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a esta tarea' },
        { status: 403 }
      );
    }

    logger.info(`Tarea obtenida: ${task.id}`, { userId: user.id });
    return NextResponse.json(task, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error fetching task:', error);
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Actualiza una tarea existente con validación Zod
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('update');
    const body = await req.json();

    // Validación con Zod
    const validatedData = taskUpdateSchema.parse(body);

    // Verificar que la tarea existe
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (existingTask.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a esta tarea' },
        { status: 403 }
      );
    }

    // Verificar usuario asignado si se actualiza
    if (validatedData.asignadoA) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: validatedData.asignadoA },
      });

      if (!assignedUser || assignedUser.companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No puede asignar tareas a usuarios de otra compañía' },
          { status: 403 }
        );
      }
    }

    const updateData: any = { ...validatedData };

    if (validatedData.fechaLimite) {
      updateData.fechaLimite = new Date(validatedData.fechaLimite);
    }

    if (validatedData.fechaInicio) {
      updateData.fechaInicio = new Date(validatedData.fechaInicio);
    }

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

    logger.info(`Tarea actualizada: ${task.id}`, { userId: user.id, taskId: task.id });
    return NextResponse.json(task, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error updating task:', error);

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
      { error: 'Error interno del servidor', message: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Elimina una tarea existente
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission('delete');

    // Verificar que la tarea existe
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (existingTask.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a esta tarea' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    logger.info(`Tarea eliminada: ${params.id}`, { userId: user.id, taskId: params.id });
    return NextResponse.json(
      { message: 'Tarea eliminada exitosamente' },
      { status: 200 }
    );
    
  } catch (error: any) {
    logger.error('Error deleting task:', error);

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
      { error: 'Error interno del servidor', message: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/proyectos/professional/tasks
 * Crear una tarea en un proyecto de servicios profesionales
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    const body = await request.json();

    // TODO: Guardar en base de datos
    const newTask = {
      id: `task_${Date.now()}`,
      ...body,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Tarea creada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[Professional Task Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proyectos/professional/tasks
 * Actualizar una tarea
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 });
    }

    const body = await request.json();

    // TODO: Actualizar en base de datos
    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error: any) {
    logger.error('[Professional Task Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proyectos/professional/tasks
 * Eliminar una tarea
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 });
    }

    // TODO: Eliminar de base de datos
    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error: any) {
    logger.error('[Professional Task Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

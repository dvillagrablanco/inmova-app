import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/proyectos/construccion/tasks
 * Crear una tarea en un proyecto
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
    const { name, description, startDate, endDate, status, priority, assignee, estimatedCost } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Nombre y fechas son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos
    const newTask = {
      id: `task_${Date.now()}`,
      name,
      description,
      startDate,
      endDate,
      progress: 0,
      status: status || 'pendiente',
      priority: priority || 'media',
      assignee,
      estimatedCost,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Tarea creada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Task Create Error]:', error);
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs de proyecto y tarea son requeridos' }, { status: 400 });
    }

    const body = await request.json();

    // TODO: Actualizar en base de datos
    return NextResponse.json({
      success: true,
      message: 'Tarea actualizada correctamente',
    });
  } catch (error: any) {
    console.error('[Task Update Error]:', error);
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'IDs de proyecto y tarea son requeridos' }, { status: 400 });
    }

    // TODO: Eliminar de base de datos
    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error: any) {
    console.error('[Task Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

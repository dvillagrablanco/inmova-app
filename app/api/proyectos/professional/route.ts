import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/proyectos/professional
 * Obtiene los proyectos de servicios profesionales
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // TODO: Obtener proyectos de la base de datos
    return NextResponse.json({
      success: true,
      projects: [],
      total: 0,
      message: 'No hay proyectos. Crea tu primer proyecto de servicios profesionales.',
    });
  } catch (error: any) {
    console.error('[Professional Projects Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proyectos/professional
 * Crear un nuevo proyecto de servicios profesionales
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, description, clientName, clientEmail, clientPhone,
      serviceType, status, startDate, endDate, 
      budget, hourlyRate, estimatedHours 
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Nombre y fechas son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos
    const newProject = {
      id: `prof_${Date.now()}`,
      name,
      description,
      clientName,
      clientEmail,
      clientPhone,
      serviceType: serviceType || 'consultoria',
      status: status || 'propuesta',
      startDate,
      endDate,
      budget: budget || 0,
      spent: 0,
      hourlyRate: hourlyRate || 0,
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      progress: 0,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Proyecto creado correctamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Professional Create Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proyectos/professional
 * Actualizar un proyecto
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    const body = await request.json();

    // TODO: Actualizar en base de datos
    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado correctamente',
    });
  } catch (error: any) {
    console.error('[Professional Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proyectos/professional
 * Eliminar un proyecto
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 });
    }

    // TODO: Eliminar de base de datos
    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Professional Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}

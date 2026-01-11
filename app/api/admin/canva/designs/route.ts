import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/canva/designs
 * Obtiene los diseños del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // TODO: Obtener diseños de la base de datos
    // Por ahora retornamos array vacío
    
    return NextResponse.json({
      success: true,
      designs: [],
      total: 0,
      message: 'No hay diseños creados. Usa las plantillas para crear tu primer diseño.',
    });
  } catch (error: any) {
    console.error('[Canva Designs Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener diseños' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/canva/designs
 * Crear un nuevo diseño
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, templateId, category, dimensions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nombre es requerido' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos y/o crear en Canva API
    const newDesign = {
      id: `design_${Date.now()}`,
      name,
      templateId,
      category: category || 'custom',
      dimensions: dimensions || '1080x1080',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      design: newDesign,
      message: 'Diseño creado correctamente',
    });
  } catch (error: any) {
    console.error('[Canva Create Design Error]:', error);
    return NextResponse.json(
      { error: 'Error al crear diseño' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/canva/designs
 * Eliminar un diseño
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    if (!designId) {
      return NextResponse.json(
        { error: 'ID de diseño es requerido' },
        { status: 400 }
      );
    }

    // TODO: Eliminar de base de datos
    
    return NextResponse.json({
      success: true,
      message: 'Diseño eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Canva Delete Design Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar diseño' },
      { status: 500 }
    );
  }
}

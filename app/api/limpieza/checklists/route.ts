import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar checklists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción consultar Prisma
    const checklists: any[] = [];

    return NextResponse.json({
      success: true,
      data: checklists,
    });
  } catch (error: any) {
    console.error('[API Limpieza Checklists Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear checklist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, tareas } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'Nombre es obligatorio' }, { status: 400 });
    }

    const nuevoChecklist = {
      id: `chk_${Date.now()}`,
      nombre,
      tipo: tipo || 'general',
      tareas: tareas || [],
      activo: true,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoChecklist,
      message: 'Checklist creado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Limpieza Checklists Error]:', error);
    return NextResponse.json({ error: 'Error al crear checklist' }, { status: 500 });
  }
}

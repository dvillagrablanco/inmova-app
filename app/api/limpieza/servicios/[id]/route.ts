import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Obtener servicio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción consultar Prisma
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Servicio no encontrado',
    });
  } catch (error: any) {
    console.error('[API Limpieza Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Actualizar servicio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { estado, horaFin, duracionReal, calificacion, notas } = body;

    // Mock - en producción actualizar en Prisma
    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body },
      message: 'Servicio actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('[API Limpieza Error]:', error);
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
  }
}

// DELETE - Eliminar servicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción eliminar de Prisma
    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('[API Limpieza Error]:', error);
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
  }
}

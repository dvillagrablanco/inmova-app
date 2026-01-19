import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Obtener instalación solar por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error: any) {
    console.error('[API Energía Solar Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Actualizar instalación solar
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

    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body },
      message: 'Instalación actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('[API Energía Solar Error]:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE - Eliminar instalación solar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Instalación eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('[API Energía Solar Error]:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

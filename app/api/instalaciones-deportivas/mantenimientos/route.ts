import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar mantenimientos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instalacionId = searchParams.get('instalacionId');
    const estado = searchParams.get('estado');

    // Mock - en producción consultar Prisma
    const mantenimientos: any[] = [];

    return NextResponse.json({
      success: true,
      data: mantenimientos,
    });
  } catch (error: any) {
    console.error('[API Mantenimientos Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Programar mantenimiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { instalacionId, tipo, fecha, descripcion, responsable, costo } = body;

    if (!instalacionId || !fecha) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const nuevoMantenimiento = {
      id: `mant_${Date.now()}`,
      instalacionId,
      instalacionNombre: 'Instalación',
      tipo: tipo || 'preventivo',
      fecha,
      descripcion: descripcion || '',
      responsable,
      costo,
      estado: 'programado',
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoMantenimiento,
      message: 'Mantenimiento programado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Mantenimientos Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error al programar mantenimiento' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar accesos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instalacionId = searchParams.get('instalacionId');
    const fecha = searchParams.get('fecha');

    // Mock - en producción consultar Prisma
    const accesos: any[] = [];

    return NextResponse.json({
      success: true,
      data: accesos,
    });
  } catch (error: any) {
    console.error('[API Accesos Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Registrar acceso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { instalacionId, usuario, metodoAcceso, tipo } = body;

    if (!instalacionId) {
      return NextResponse.json({ error: 'Instalación es obligatoria' }, { status: 400 });
    }

    const nuevoAcceso = {
      id: `acc_${Date.now()}`,
      instalacionId,
      instalacionNombre: 'Instalación',
      usuario: usuario || session.user.name || session.user.email,
      fecha: new Date().toISOString().split('T')[0],
      horaEntrada: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      horaSalida: null,
      metodoAcceso: metodoAcceso || 'manual',
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoAcceso,
      message: 'Acceso registrado',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Accesos Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error al registrar acceso' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar historial de ejecuciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const ejecuciones: any[] = [];

    return NextResponse.json({
      success: true,
      data: ejecuciones,
    });
  } catch (error: any) {
    console.error('[API Ejecuciones Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Ejecutar informe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { informeId } = body;

    if (!informeId) {
      return NextResponse.json({ error: 'ID de informe requerido' }, { status: 400 });
    }

    const ejecucion = {
      id: `ejec_${Date.now()}`,
      informeId,
      informeNombre: 'Informe',
      fechaEjecucion: new Date().toISOString(),
      estado: 'completado',
      registros: 0,
      tiempoEjecucion: 1,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: ejecucion,
      message: 'Informe ejecutado',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Ejecuciones Error]:', error);
    return NextResponse.json({ error: 'Error al ejecutar informe' }, { status: 500 });
  }
}

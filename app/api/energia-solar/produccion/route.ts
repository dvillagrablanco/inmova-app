import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Obtener datos de producción
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes';
    const instalacionId = searchParams.get('instalacionId');

    // Mock - en producción consultar datos de monitoreo
    const produccion: any[] = [];

    return NextResponse.json({
      success: true,
      data: produccion,
      periodo,
    });
  } catch (error: any) {
    console.error('[API Energía Solar Producción Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Registrar lectura de producción
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { instalacionId, fecha, produccion, consumo } = body;

    if (!instalacionId || produccion === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const registro = {
      id: `prod_${Date.now()}`,
      instalacionId,
      fecha: fecha || new Date().toISOString(),
      produccion,
      consumo: consumo || 0,
      excedente: Math.max(0, produccion - (consumo || 0)),
      autoconsumo: consumo ? Math.min(100, (Math.min(produccion, consumo) / produccion) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Lectura registrada',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Energía Solar Producción Error]:', error);
    return NextResponse.json({ error: 'Error al registrar lectura' }, { status: 500 });
  }
}

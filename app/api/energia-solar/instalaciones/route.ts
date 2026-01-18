import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar instalaciones solares
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción consultar Prisma
    const instalaciones: any[] = [];

    return NextResponse.json({
      success: true,
      data: instalaciones,
    });
  } catch (error: any) {
    console.error('[API Energía Solar Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Registrar instalación solar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { propiedadId, capacidadKw, numeroPaneles, fechaInstalacion, inversor, inversionInicial } = body;

    if (!propiedadId || !capacidadKw) {
      return NextResponse.json({ error: 'Propiedad y capacidad son obligatorios' }, { status: 400 });
    }

    const nuevaInstalacion = {
      id: `solar_${Date.now()}`,
      propiedadId,
      capacidadKw,
      numeroPaneles: numeroPaneles || Math.round(capacidadKw * 2.5),
      fechaInstalacion: fechaInstalacion || new Date().toISOString(),
      inversor: inversor || 'No especificado',
      inversionInicial: inversionInicial || 0,
      estado: 'operativo',
      produccionHoy: 0,
      produccionMes: 0,
      produccionAnio: 0,
      eficiencia: 95,
      garantiaHasta: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaInstalacion,
      message: 'Instalación solar registrada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Energía Solar Error]:', error);
    return NextResponse.json({ error: 'Error al registrar instalación' }, { status: 500 });
  }
}

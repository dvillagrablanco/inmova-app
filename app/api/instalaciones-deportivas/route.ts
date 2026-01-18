import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar instalaciones deportivas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    // Mock - en producción consultar Prisma
    const instalaciones: any[] = [];

    return NextResponse.json({
      success: true,
      data: instalaciones,
    });
  } catch (error: any) {
    console.error('[API Instalaciones Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear instalación deportiva
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, ubicacion, capacidad, horarioApertura, horarioCierre, precioHora, incluidoEnCuota, descripcion } = body;

    if (!nombre || !ubicacion) {
      return NextResponse.json({ error: 'Nombre y ubicación son obligatorios' }, { status: 400 });
    }

    const nuevaInstalacion = {
      id: `inst_${Date.now()}`,
      nombre,
      tipo: tipo || 'otro',
      ubicacion,
      capacidad: capacidad || 10,
      horarioApertura: horarioApertura || '07:00',
      horarioCierre: horarioCierre || '22:00',
      precioHora: precioHora || 0,
      incluidoEnCuota: incluidoEnCuota ?? true,
      descripcion,
      estado: 'disponible',
      amenidades: [],
      reservasHoy: 0,
      ocupacionSemana: 0,
      calificacion: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaInstalacion,
      message: 'Instalación creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Instalaciones Deportivas Error]:', error);
    return NextResponse.json({ error: 'Error al crear instalación' }, { status: 500 });
  }
}

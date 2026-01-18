import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar habitaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const habitaciones: any[] = [];

    return NextResponse.json({
      success: true,
      data: habitaciones,
    });
  } catch (error: any) {
    console.error('[API Hospitality Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear habitación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { numero, tipo, propiedadId, capacidad, precioNoche, amenidades } = body;

    if (!numero || !propiedadId) {
      return NextResponse.json({ error: 'Número y propiedad son obligatorios' }, { status: 400 });
    }

    const nuevaHabitacion = {
      id: `hab_${Date.now()}`,
      numero,
      tipo: tipo || 'estandar',
      propiedadId,
      capacidad: capacidad || 2,
      precioNoche: precioNoche || 0,
      amenidades: amenidades || [],
      estado: 'disponible',
      ocupacion: 0,
      proximaReserva: null,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaHabitacion,
      message: 'Habitación creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Hospitality Error]:', error);
    return NextResponse.json({ error: 'Error al crear habitación' }, { status: 500 });
  }
}

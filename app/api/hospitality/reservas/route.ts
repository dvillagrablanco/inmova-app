import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar reservas hoteleras
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habitacionId = searchParams.get('habitacionId');
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');

    const reservas: any[] = [];

    return NextResponse.json({
      success: true,
      data: reservas,
    });
  } catch (error: any) {
    console.error('[API Hospitality Reservas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear reserva hotelera
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { habitacionId, huesped, fechaEntrada, fechaSalida, adultos, ninos, precio, origen } = body;

    if (!habitacionId || !huesped || !fechaEntrada || !fechaSalida) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const nuevaReserva = {
      id: `res_${Date.now()}`,
      habitacionId,
      huesped,
      fechaEntrada,
      fechaSalida,
      adultos: adultos || 1,
      ninos: ninos || 0,
      precio: precio || 0,
      origen: origen || 'directo',
      estado: 'confirmada',
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaReserva,
      message: 'Reserva creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Hospitality Reservas Error]:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}

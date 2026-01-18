import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar reservas de salas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const salaId = searchParams.get('salaId');
    const fecha = searchParams.get('fecha');

    const reservas: any[] = [];

    return NextResponse.json({
      success: true,
      data: reservas,
    });
  } catch (error: any) {
    console.error('[API Reservas Salas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { salaId, fecha, horaInicio, horaFin, asunto, asistentes } = body;

    if (!salaId || !fecha || !horaInicio || !horaFin) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const nuevaReserva = {
      id: `res_${Date.now()}`,
      salaId,
      salaNombre: 'Sala',
      usuario: session.user.name || session.user.email,
      usuarioId: session.user.id,
      fecha,
      horaInicio,
      horaFin,
      asunto,
      asistentes: asistentes || [],
      estado: 'confirmada',
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaReserva,
      message: 'Reserva creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Reservas Salas Error]:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar salas de reuniones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const edificioId = searchParams.get('edificioId');

    const salas: any[] = [];

    return NextResponse.json({
      success: true,
      data: salas,
    });
  } catch (error: any) {
    console.error('[API Salas Reuniones Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear sala de reuniones
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, edificioId, capacidad, equipamiento, precioHora, incluidoEnCuota } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'Nombre es obligatorio' }, { status: 400 });
    }

    const nuevaSala = {
      id: `sala_${Date.now()}`,
      nombre,
      edificioId,
      capacidad: capacidad || 10,
      equipamiento: equipamiento || [],
      precioHora: precioHora || 0,
      incluidoEnCuota: incluidoEnCuota ?? true,
      estado: 'disponible',
      reservasHoy: 0,
      ocupacion: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaSala,
      message: 'Sala creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Salas Reuniones Error]:', error);
    return NextResponse.json({ error: 'Error al crear sala' }, { status: 500 });
  }
}

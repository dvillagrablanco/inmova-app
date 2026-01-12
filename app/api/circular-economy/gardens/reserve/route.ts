import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Reservar una parcela
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { gardenId, months } = body;

    if (!gardenId) {
      return NextResponse.json(
        { error: 'El ID del huerto es requerido' },
        { status: 400 }
      );
    }

    if (!months || months < 1) {
      return NextResponse.json(
        { error: 'La duración mínima es 1 mes' },
        { status: 400 }
      );
    }

    // Crear reserva en la base de datos (cuando el modelo exista)
    // Por ahora simulamos la reserva exitosa
    const reservation = {
      id: `plot_${Date.now()}`,
      gardenId,
      plotNumber: `P-${Math.floor(Math.random() * 100)}`,
      plantedCrops: [],
      lastWatered: null,
      nextHarvest: null,
      status: 'pending',
      months,
      userId: session.user?.id,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    console.error('[Circular Economy Reserve POST]:', error);
    return NextResponse.json(
      { error: 'Error al reservar parcela' },
      { status: 500 }
    );
  }
}

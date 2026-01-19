import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for demo
let sportsReservations: any[] = [];
let sportsFacilitiesRef: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const reservations = sportsReservations.filter((r) => r.companyId === companyId);

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('[Sports API] Error fetching reservations:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userName = (session.user as any).name || (session.user as any).email || 'Usuario';
    const body = await request.json();

    if (!body.facilityId || !body.fecha || !body.horaInicio || !body.horaFin) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Find facility name (simplified - would be a DB query)
    const facilityName = body.facilityName || 'Instalación';

    const newReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      facilityId: body.facilityId,
      facilityName: facilityName,
      fecha: body.fecha,
      horaInicio: body.horaInicio,
      horaFin: body.horaFin,
      usuario: userName,
      estado: 'CONFIRMADA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sportsReservations.push(newReservation);

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error('[Sports API] Error creating reservation:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}

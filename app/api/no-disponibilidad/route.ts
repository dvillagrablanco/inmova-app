export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MOCK_PERIODS = [
  { id: '1', inmuebleId: 'inv1', inmuebleNombre: 'Piso Centro Madrid', motivo: 'reforma', fechaDesde: '2026-03-01', fechaHasta: '2026-03-15', notas: 'Obras en baño' },
  { id: '2', inmuebleId: 'inv2', inmuebleNombre: 'Ático Barcelona', motivo: 'venta', fechaDesde: '2026-03-10', fechaHasta: '2026-04-10', notas: 'En proceso de venta' },
  { id: '3', inmuebleId: 'inv3', inmuebleNombre: 'Chalet Valencia', motivo: 'personal', fechaDesde: '2026-03-05', fechaHasta: '2026-03-20', notas: 'Uso familiar temporal' },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json(MOCK_PERIODS);
  } catch (error) {
    console.error('[no-disponibilidad GET]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await req.json();
    const { inmuebleId, inmuebleNombre, motivo, fechaDesde, fechaHasta, notas } = body;
    if (!inmuebleId || !inmuebleNombre || !motivo || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Faltan campos: inmuebleId, inmuebleNombre, motivo, fechaDesde, fechaHasta' },
        { status: 400 }
      );
    }
    const nuevo = {
      id: String(Date.now()),
      inmuebleId,
      inmuebleNombre,
      motivo,
      fechaDesde,
      fechaHasta,
      notas: notas || '',
    };
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error('[no-disponibilidad POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

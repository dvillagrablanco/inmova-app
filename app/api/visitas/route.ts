export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MOCK_VISITAS = [
  { id: '1', fecha: '2026-03-08', hora: '10:00', inmuebleId: 'inv1', inmuebleNombre: 'Piso Centro Madrid', candidatoId: 'c1', candidatoNombre: 'Juan Pérez', agenteNombre: 'María García', estado: 'programada', notas: 'Primera visita', resultado: null },
  { id: '2', fecha: '2026-03-07', hora: '16:00', inmuebleId: 'inv2', inmuebleNombre: 'Ático Barcelona', candidatoId: 'c2', candidatoNombre: 'Ana López', agenteNombre: 'Carlos Ruiz', estado: 'realizada', notas: 'Muy interesada', resultado: 'Interesado' },
  { id: '3', fecha: '2026-03-06', hora: '11:30', inmuebleId: 'inv1', inmuebleNombre: 'Piso Centro Madrid', candidatoId: 'c3', candidatoNombre: 'Pedro Sánchez', agenteNombre: 'María García', estado: 'cancelada', notas: 'Canceló por trabajo', resultado: null },
  { id: '4', fecha: '2026-03-05', hora: '09:00', inmuebleId: 'inv3', inmuebleNombre: 'Chalet Valencia', candidatoId: 'c4', candidatoNombre: 'Laura Martínez', agenteNombre: 'Carlos Ruiz', estado: 'no-show', notas: 'No se presentó', resultado: null },
  { id: '5', fecha: '2026-03-04', hora: '12:00', inmuebleId: 'inv2', inmuebleNombre: 'Ático Barcelona', candidatoId: 'c5', candidatoNombre: 'Miguel Torres', agenteNombre: 'María García', estado: 'realizada', notas: 'Firma próxima semana', resultado: 'Contratado' },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json(MOCK_VISITAS);
  } catch (error) {
    console.error('[visitas GET]:', error);
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
    const { fecha, hora, inmuebleId, inmuebleNombre, candidatoId, candidatoNombre, agenteNombre, estado, notas } = body;
    if (!fecha || !inmuebleId || !inmuebleNombre) {
      return NextResponse.json(
        { error: 'Faltan campos: fecha, inmuebleId, inmuebleNombre' },
        { status: 400 }
      );
    }
    const nuevo = {
      id: String(Date.now()),
      fecha,
      hora: hora || '10:00',
      inmuebleId,
      inmuebleNombre,
      candidatoId: candidatoId || null,
      candidatoNombre: candidatoNombre || '-',
      agenteNombre: agenteNombre || session.user?.name || 'Agente',
      estado: estado || 'programada',
      notas: notas || '',
      resultado: null,
    };
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error('[visitas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

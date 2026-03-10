export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MOCK_BATCHES = [
  {
    id: '1',
    tipo: 'cobro_masivo',
    entidades: ['Inmueble A', 'Inmueble B'],
    concepto: 'Alquiler enero 2026',
    importe: 2400,
    estado: 'pendiente',
    fechaCreacion: '2026-03-08T10:00:00Z',
    fechaProcesamiento: null,
  },
  {
    id: '2',
    tipo: 'gasto_masivo',
    entidades: ['Inmueble C'],
    concepto: 'IBI trimestral',
    importe: 450,
    estado: 'procesado',
    fechaCreacion: '2026-03-05T09:00:00Z',
    fechaProcesamiento: '2026-03-05T09:15:00Z',
  },
  {
    id: '3',
    tipo: 'transferencia',
    entidades: ['Cuenta A → Cuenta B'],
    concepto: 'Traspaso fondos',
    importe: 5000,
    estado: 'error',
    fechaCreacion: '2026-03-07T14:00:00Z',
    fechaProcesamiento: null,
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json(MOCK_BATCHES);
  } catch (error) {
    console.error('[acciones-masivas GET]:', error);
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
    const { tipo, entidades, concepto, importe } = body;
    if (!tipo || !entidades?.length || !concepto || importe == null) {
      return NextResponse.json(
        { error: 'Faltan campos: tipo, entidades, concepto, importe' },
        { status: 400 }
      );
    }
    const nuevo = {
      id: String(Date.now()),
      tipo,
      entidades: Array.isArray(entidades) ? entidades : [entidades],
      concepto,
      importe: Number(importe),
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaProcesamiento: null,
    };
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error('[acciones-masivas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

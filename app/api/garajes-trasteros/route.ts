import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_ENTRIES = [
  {
    id: 'gt-1',
    tipo: 'garaje',
    numero: 'G-01',
    edificioId: 'b1',
    edificioNombre: 'Edificio Centro',
    unidadVinculada: '3A',
    inquilinoNombre: 'María García López',
    precioMensual: 85,
    estado: 'ocupado',
    planta: 0,
    metros2: 18,
  },
  {
    id: 'gt-2',
    tipo: 'garaje',
    numero: 'G-02',
    edificioId: 'b1',
    edificioNombre: 'Edificio Centro',
    unidadVinculada: null,
    inquilinoNombre: null,
    precioMensual: 85,
    estado: 'libre',
    planta: 0,
    metros2: 18,
  },
  {
    id: 'gt-3',
    tipo: 'garaje',
    numero: 'G-03',
    edificioId: 'b2',
    edificioNombre: 'Residencial Norte',
    unidadVinculada: '5B',
    inquilinoNombre: 'Carlos Ruiz Martínez',
    precioMensual: 95,
    estado: 'reservado',
    planta: -1,
    metros2: 20,
  },
  {
    id: 'gt-4',
    tipo: 'trastero',
    numero: 'T-01',
    edificioId: 'b1',
    edificioNombre: 'Edificio Centro',
    unidadVinculada: '3A',
    inquilinoNombre: 'María García López',
    precioMensual: 35,
    estado: 'ocupado',
    planta: 1,
    metros2: 8,
  },
  {
    id: 'gt-5',
    tipo: 'trastero',
    numero: 'T-02',
    edificioId: 'b1',
    edificioNombre: 'Edificio Centro',
    unidadVinculada: null,
    inquilinoNombre: null,
    precioMensual: 35,
    estado: 'libre',
    planta: 1,
    metros2: 8,
  },
  {
    id: 'gt-6',
    tipo: 'trastero',
    numero: 'T-03',
    edificioId: 'b2',
    edificioNombre: 'Residencial Norte',
    unidadVinculada: '5B',
    inquilinoNombre: 'Carlos Ruiz Martínez',
    precioMensual: 40,
    estado: 'ocupado',
    planta: 2,
    metros2: 10,
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    let data = [...MOCK_ENTRIES];
    if (tipo) {
      data = data.filter((e) => e.tipo === tipo);
    }
    if (estado) {
      data = data.filter((e) => e.estado === estado);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener garajes y trasteros' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo,
      numero,
      edificioId,
      edificioNombre,
      unidadVinculada,
      inquilinoNombre,
      precioMensual,
      estado,
      planta,
      metros2,
    } = body;

    const id = `gt-${Date.now()}`;
    const entry = {
      id,
      tipo: tipo || 'garaje',
      numero: numero || 'N/A',
      edificioId,
      edificioNombre: edificioNombre || '',
      unidadVinculada: unidadVinculada || null,
      inquilinoNombre: inquilinoNombre || null,
      precioMensual: precioMensual || 0,
      estado: estado || 'libre',
      planta: planta ?? 0,
      metros2: metros2 ?? 0,
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear garaje/trastero' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_SUPPLIES = [
  {
    id: 'sum-1',
    inmuebleId: 'unit-1',
    inmuebleNombre: 'Edificio Centro - 3A',
    tipo: 'electricidad',
    proveedor: 'Iberdrola',
    numeroContrato: 'ES-2024-001234',
    titular: 'María García López',
    estado: 'activo',
    ultimaLectura: '4520',
    ultimaLecturaFecha: '2025-03-01',
    lecturas: [
      { fecha: '2025-03-01', valor: 4520, consumo: 85 },
      { fecha: '2025-02-01', valor: 4435, consumo: 92 },
    ],
  },
  {
    id: 'sum-2',
    inmuebleId: 'unit-1',
    inmuebleNombre: 'Edificio Centro - 3A',
    tipo: 'agua',
    proveedor: 'Canal de Isabel II',
    numeroContrato: 'AG-2024-567890',
    titular: 'María García López',
    estado: 'activo',
    ultimaLectura: '1250',
    ultimaLecturaFecha: '2025-03-01',
    lecturas: [
      { fecha: '2025-03-01', valor: 1250, consumo: 12 },
      { fecha: '2025-02-01', valor: 1238, consumo: 14 },
    ],
  },
  {
    id: 'sum-3',
    inmuebleId: 'unit-2',
    inmuebleNombre: 'Residencial Norte - 5B',
    tipo: 'gas',
    proveedor: 'Naturgy',
    numeroContrato: 'GS-2024-111222',
    titular: 'Carlos Ruiz Martínez',
    estado: 'activo',
    ultimaLectura: '3200',
    ultimaLecturaFecha: '2025-02-28',
    lecturas: [
      { fecha: '2025-02-28', valor: 3200, consumo: 45 },
    ],
  },
  {
    id: 'sum-4',
    inmuebleId: 'unit-2',
    inmuebleNombre: 'Residencial Norte - 5B',
    tipo: 'internet',
    proveedor: 'Movistar',
    numeroContrato: 'FT-2024-333444',
    titular: 'Carlos Ruiz Martínez',
    estado: 'activo',
    ultimaLectura: null,
    ultimaLecturaFecha: null,
    lecturas: [],
  },
  {
    id: 'sum-5',
    inmuebleId: 'unit-3',
    inmuebleNombre: 'Edificio Centro - 1C',
    tipo: 'electricidad',
    proveedor: 'Endesa',
    numeroContrato: 'ES-2023-555666',
    titular: 'Inmobiliaria Centro',
    estado: 'baja',
    ultimaLectura: '2100',
    ultimaLecturaFecha: '2025-01-15',
    lecturas: [],
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

    let data = [...MOCK_SUPPLIES];
    if (tipo) {
      data = data.filter((e) => e.tipo === tipo);
    }
    if (estado) {
      data = data.filter((e) => e.estado === estado);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener suministros' },
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
      inmuebleId,
      inmuebleNombre,
      tipo,
      proveedor,
      numeroContrato,
      titular,
      estado,
      ultimaLectura,
      lecturas = [],
    } = body;

    const id = `sum-${Date.now()}`;
    const entry = {
      id,
      inmuebleId,
      inmuebleNombre: inmuebleNombre || '',
      tipo: tipo || 'electricidad',
      proveedor: proveedor || '',
      numeroContrato: numeroContrato || '',
      titular: titular || '',
      estado: estado || 'activo',
      ultimaLectura: ultimaLectura || null,
      ultimaLecturaFecha: lecturas?.length
        ? lecturas[lecturas.length - 1]?.fecha
        : null,
      lecturas: lecturas || [],
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear suministro' },
      { status: 500 }
    );
  }
}

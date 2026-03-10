import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock data para desarrollo
const MOCK_ENTRIES = [
  {
    id: 'cio-1',
    tipo: 'check-in',
    inquilinoId: 'inq-1',
    inquilinoNombre: 'María García López',
    inmuebleId: 'unit-1',
    inmuebleNombre: 'Edificio Centro - 3A',
    fecha: '2025-03-15',
    estado: 'pendiente',
    token: 'tok-abc123',
    items: [
      { nombre: 'Llaves de entrada', estado: 'pendiente',
    valor: null, foto: null },
      { nombre: 'Contador agua', estado: 'completado', valor: '1250', foto: null },
      { nombre: 'Contador luz', estado: 'completado', valor: '4520', foto: null },
      { nombre: 'Estado paredes', estado: 'pendiente', valor: null, foto: null },
    ],
    createdAt: '2025-03-10T09:00:00Z',
  },
  {
    id: 'cio-2',
    tipo: 'check-out',
    inquilinoId: 'inq-2',
    inquilinoNombre: 'Carlos Ruiz Martínez',
    inmuebleId: 'unit-2',
    inmuebleNombre: 'Residencial Norte - 5B',
    fecha: '2025-03-20',
    estado: 'completado',
    token: 'tok-def456',
    items: [
      { nombre: 'Llaves de entrada', estado: 'completado', valor: null, foto: null },
      { nombre: 'Contador agua', estado: 'completado', valor: '1280', foto: null },
      { nombre: 'Contador luz', estado: 'completado', valor: '4580', foto: null },
      { nombre: 'Estado paredes', estado: 'completado', valor: 'Bueno', foto: null },
    ],
    createdAt: '2025-03-08T14:30:00Z',
  },
  {
    id: 'cio-3',
    tipo: 'check-in',
    inquilinoId: 'inq-3',
    inquilinoNombre: 'Ana Fernández Sánchez',
    inmuebleId: 'unit-3',
    inmuebleNombre: 'Edificio Centro - 1C',
    fecha: '2025-03-25',
    estado: 'pendiente',
    token: 'tok-ghi789',
    items: [
      { nombre: 'Llaves de entrada', estado: 'pendiente', valor: null, foto: null },
      { nombre: 'Contador agua', estado: 'pendiente', valor: null, foto: null },
      { nombre: 'Contador luz', estado: 'pendiente', valor: null, foto: null },
    ],
    createdAt: '2025-03-09T11:00:00Z',
  },
  {
    id: 'cio-4',
    tipo: 'check-out',
    inquilinoId: 'inq-1',
    inquilinoNombre: 'María García López',
    inmuebleId: 'unit-4',
    inmuebleNombre: 'Residencial Sur - 2A',
    fecha: '2025-03-12',
    estado: 'completado',
    token: 'tok-jkl012',
    items: [],
    createdAt: '2025-03-05T16:00:00Z',
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
      { error: 'Error al obtener check-ins/check-outs' },
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
      inquilinoId,
      inquilinoNombre,
      inmuebleId,
      inmuebleNombre,
      fecha,
      items = [],
    } = body;

    const id = `cio-${Date.now()}`;
    const token = `tok-${Math.random().toString(36).slice(2, 10)}`;
    const entry = {
      id,
      tipo: tipo || 'check-in',
      inquilinoId,
      inquilinoNombre,
      inmuebleId,
      inmuebleNombre,
      fecha: fecha || new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      token,
      items,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear check-in/check-out' },
      { status: 500 }
    );
  }
}

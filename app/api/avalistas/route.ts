import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_AVALISTAS = [
  {
    id: 'av-1',
    nombre: 'Juan Pérez Fernández',
    dni: '12345678A',
    telefono: '+34 612 345 678',
    email: 'juan.perez@email.com',
    contratoId: 'c1',
    contratoRef: 'CT-2024-001',
    inmuebleNombre: 'Edificio Centro - 3A',
    tipoGarantia: 'personal',
    importe: 2400,
    estado: 'activo',
    fechaInicio: '2024-01-15',
    fechaFin: '2025-01-14',
  },
  {
    id: 'av-2',
    nombre: 'Laura Martínez Sánchez',
    dni: '87654321B',
    telefono: '+34 698 765 432',
    email: 'laura.martinez@email.com',
    contratoId: 'c2',
    contratoRef: 'CT-2024-002',
    inmuebleNombre: 'Residencial Norte - 5B',
    tipoGarantia: 'bancaria',
    importe: 3600,
    estado: 'activo',
    fechaInicio: '2024-02-01',
    fechaFin: '2025-01-31',
  },
  {
    id: 'av-3',
    nombre: 'Pedro Gómez López',
    dni: '11223344C',
    telefono: '+34 655 111 222',
    email: 'pedro.gomez@email.com',
    contratoId: 'c3',
    contratoRef: 'CT-2023-015',
    inmuebleNombre: 'Edificio Centro - 1C',
    tipoGarantia: 'seguro',
    importe: 1800,
    estado: 'liberado',
    fechaInicio: '2023-06-01',
    fechaFin: '2024-05-31',
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipoGarantia = searchParams.get('tipoGarantia');

    let data = [...MOCK_AVALISTAS];
    if (estado) {
      data = data.filter((e) => e.estado === estado);
    }
    if (tipoGarantia) {
      data = data.filter((e) => e.tipoGarantia === tipoGarantia);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener avalistas' },
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
      nombre,
      dni,
      telefono,
      email,
      contratoId,
      contratoRef,
      inmuebleNombre,
      tipoGarantia,
      importe,
      estado,
      fechaInicio,
      fechaFin,
    } = body;

    const id = `av-${Date.now()}`;
    const entry = {
      id,
      nombre: nombre || '',
      dni: dni || '',
      telefono: telefono || '',
      email: email || '',
      contratoId,
      contratoRef: contratoRef || '',
      inmuebleNombre: inmuebleNombre || '',
      tipoGarantia: tipoGarantia || 'personal',
      importe: importe || 0,
      estado: estado || 'activo',
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear avalista' },
      { status: 500 }
    );
  }
}

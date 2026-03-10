import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_ACTUALIZACIONES = [
  {
    id: 'ar-1',
    contratoId: 'c1',
    contratoRef: 'CT-2024-001',
    inquilinoNombre: 'María García López',
    inmuebleNombre: 'Edificio Centro - 3A',
    fechaRevision: '2025-04-01',
    tipo: 'IPC',
    rentaAnterior: 950,
    rentaNueva: 980,
    incrementoPorcentaje: 3.16,
    estado: 'pendiente',
    fechaComunicacion: null,
  },
  {
    id: 'ar-2',
    contratoId: 'c2',
    contratoRef: 'CT-2024-002',
    inquilinoNombre: 'Carlos Ruiz Martínez',
    inmuebleNombre: 'Residencial Norte - 5B',
    fechaRevision: '2025-03-15',
    tipo: 'IPC',
    rentaAnterior: 1200,
    rentaNueva: 1234,
    incrementoPorcentaje: 2.83,
    estado: 'comunicada',
    fechaComunicacion: '2025-03-01',
  },
  {
    id: 'ar-3',
    contratoId: 'c3',
    contratoRef: 'CT-2023-015',
    inquilinoNombre: 'Ana Fernández Sánchez',
    inmuebleNombre: 'Edificio Centro - 1C',
    fechaRevision: '2025-05-01',
    tipo: 'pactado',
    rentaAnterior: 800,
    rentaNueva: 840,
    incrementoPorcentaje: 5,
    estado: 'aplicada',
    fechaComunicacion: '2025-02-15',
  },
  {
    id: 'ar-4',
    contratoId: 'c4',
    contratoRef: 'CT-2022-008',
    inquilinoNombre: 'Pedro Gómez López',
    inmuebleNombre: 'Residencial Sur - 2A',
    fechaRevision: '2025-06-01',
    tipo: 'renta_referencia',
    rentaAnterior: 1100,
    rentaNueva: 1120,
    incrementoPorcentaje: 1.82,
    estado: 'pendiente',
    fechaComunicacion: null,
  },
  {
    id: 'ar-5',
    contratoId: 'c5',
    contratoRef: 'CT-2024-010',
    inquilinoNombre: 'Laura Martínez Sánchez',
    inmuebleNombre: 'Edificio Centro - 4B',
    fechaRevision: '2025-04-15',
    tipo: 'IPC',
    rentaAnterior: 1050,
    rentaNueva: 1079,
    incrementoPorcentaje: 2.76,
    estado: 'rechazada',
    fechaComunicacion: '2025-03-10',
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
    const tipo = searchParams.get('tipo');

    let data = [...MOCK_ACTUALIZACIONES];
    if (estado) {
      data = data.filter((e) => e.estado === estado);
    }
    if (tipo) {
      data = data.filter((e) => e.tipo === tipo);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener actualizaciones de renta' },
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
      contratoId,
      contratoRef,
      inquilinoNombre,
      inmuebleNombre,
      fechaRevision,
      tipo,
      rentaAnterior,
      rentaNueva,
      estado,
      fechaComunicacion,
    } = body;

    const incrementoPorcentaje =
      rentaAnterior > 0
        ? ((rentaNueva - rentaAnterior) / rentaAnterior) * 100
        : 0;

    const id = `ar-${Date.now()}`;
    const entry = {
      id,
      contratoId,
      contratoRef: contratoRef || '',
      inquilinoNombre: inquilinoNombre || '',
      inmuebleNombre: inmuebleNombre || '',
      fechaRevision: fechaRevision || new Date().toISOString().split('T')[0],
      tipo: tipo || 'IPC',
      rentaAnterior: rentaAnterior || 0,
      rentaNueva: rentaNueva || 0,
      incrementoPorcentaje,
      estado: estado || 'pendiente',
      fechaComunicacion: fechaComunicacion || null,
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear actualización de renta' },
      { status: 500 }
    );
  }
}

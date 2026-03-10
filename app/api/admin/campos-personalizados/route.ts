export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const ENTIDADES = ['inmueble', 'inquilino', 'contrato', 'incidencia', 'propietario'] as const;
const TIPOS = ['texto', 'numero', 'fecha', 'select', 'checkbox'] as const;

const MOCK_FIELDS: Record<string, Array<{
  id: string;
  entidad: string;
  nombre: string;
  tipo: string;
  obligatorio: boolean;
  opciones?: string[];
  orden: number;
  activo: boolean;
}>> = {
  inmueble: [
    { id: '1', entidad: 'inmueble', nombre: 'Referencia catastral', tipo: 'texto', obligatorio: true, orden: 1, activo: true },
    { id: '2', entidad: 'inmueble', nombre: 'Año construcción', tipo: 'numero', obligatorio: false, orden: 2, activo: true },
    { id: '3', entidad: 'inmueble', nombre: 'Tipo de calefacción', tipo: 'select', obligatorio: false, opciones: ['Gas', 'Eléctrica', 'Bomba calor'], orden: 3, activo: true },
  ],
  inquilino: [
    { id: '4', entidad: 'inquilino', nombre: 'NIF', tipo: 'texto', obligatorio: true, orden: 1, activo: true },
    { id: '5', entidad: 'inquilino', nombre: 'Profesión', tipo: 'texto', obligatorio: false, orden: 2, activo: true },
  ],
  contrato: [
    { id: '6', entidad: 'contrato', nombre: 'Cláusula especial', tipo: 'texto', obligatorio: false, orden: 1, activo: true },
  ],
  incidencia: [],
  propietario: [
    { id: '7', entidad: 'propietario', nombre: 'Banco preferido', tipo: 'select', obligatorio: false, opciones: ['BBVA', 'Santander', 'CaixaBank'], orden: 1, activo: true },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const entidad = req.nextUrl.searchParams.get('entidad');
    if (entidad && ENTIDADES.includes(entidad as any)) {
      return NextResponse.json(MOCK_FIELDS[entidad] || []);
    }
    return NextResponse.json(Object.values(MOCK_FIELDS).flat());
  } catch (error) {
    console.error('[campos-personalizados GET]:', error);
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
    const { entidad, nombre, tipo, obligatorio, opciones, orden } = body;
    if (!entidad || !nombre || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos: entidad, nombre, tipo' },
        { status: 400 }
      );
    }
    if (!ENTIDADES.includes(entidad)) {
      return NextResponse.json({ error: 'Entidad no válida' }, { status: 400 });
    }
    if (!TIPOS.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }
    const nuevo = {
      id: String(Date.now()),
      entidad,
      nombre,
      tipo,
      obligatorio: !!obligatorio,
      opciones: tipo === 'select' ? (opciones || []) : undefined,
      orden: Number(orden) || 0,
      activo: true,
    };
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error('[campos-personalizados POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await req.json();
    const { id, nombre, tipo, obligatorio, opciones, orden, activo } = body;
    if (!id) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    }
    const actualizado = {
      id,
      nombre: nombre ?? 'Campo',
      tipo: tipo ?? 'texto',
      obligatorio: !!obligatorio,
      opciones: tipo === 'select' ? (opciones || []) : undefined,
      orden: Number(orden) ?? 0,
      activo: activo !== false,
    };
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('[campos-personalizados PUT]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

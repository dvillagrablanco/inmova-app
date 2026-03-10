/**
 * API: Liquidaciones a Propietarios
 * Gestión de liquidaciones de rentas a propietarios
 * Almacenamiento en memoria (Map) - sin modelo Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type LiquidacionEstado = 'pendiente' | 'pagada' | 'anulada';

export interface Liquidacion {
  id: string;
  companyId: string;
  propietarioId: string;
  propietarioNombre: string;
  propietarioEmail: string;
  inmuebleId: string;
  inmuebleNombre: string;
  inmuebleDireccion: string;
  periodoMes: number;
  periodoAnio: number;
  rentaCobrada: number;
  honorariosGestion: number;
  honorariosMonto: number;
  gastosRepercutibles: number;
  otrosGastos: number;
  netoAPagar: number;
  estado: LiquidacionEstado;
  notas: string;
  fechaPago: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  history: Array<{ fecha: string; estado: LiquidacionEstado; nota?: string }>;
}

const liquidacionesStore = new Map<string, Liquidacion>();

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const seededCompanies = new Set<string>();

function seedMockLiquidaciones(companyId: string): void {
  if (seededCompanies.has(companyId)) return;
  seededCompanies.add(companyId);

  const now = new Date();
  const samples: Omit<Liquidacion, 'id'>[] = [
    {
      companyId,
      propietarioId: 'prop-1',
      propietarioNombre: 'Juan García López',
      propietarioEmail: 'juan.garcia@email.com',
      inmuebleId: 'inv-1',
      inmuebleNombre: 'Calle Mayor 10, 1A',
      inmuebleDireccion: 'Calle Mayor 10, 1A, 28013 Madrid',
      periodoMes: 2,
      periodoAnio: 2025,
      rentaCobrada: 950,
      honorariosGestion: 10,
      honorariosMonto: 95,
      gastosRepercutibles: 45,
      otrosGastos: 0,
      netoAPagar: 810,
      estado: 'pendiente',
      notas: '',
      fechaPago: null,
      createdAt: new Date(2025, 1, 5).toISOString(),
      updatedAt: new Date(2025, 1, 5).toISOString(),
      deletedAt: null,
      history: [{ fecha: new Date(2025, 1, 5).toISOString(), estado: 'pendiente' }],
    },
    {
      companyId,
      propietarioId: 'prop-2',
      propietarioNombre: 'María Fernández Ruiz',
      propietarioEmail: 'maria.fernandez@email.com',
      inmuebleId: 'inv-3',
      inmuebleNombre: 'Avenida España 45, 3º',
      inmuebleDireccion: 'Avenida España 45, 3º, 28003 Madrid',
      periodoMes: 2,
      periodoAnio: 2025,
      rentaCobrada: 1200,
      honorariosGestion: 10,
      honorariosMonto: 120,
      gastosRepercutibles: 80,
      otrosGastos: 0,
      netoAPagar: 1000,
      estado: 'pagada',
      notas: '',
      fechaPago: new Date(2025, 2, 1).toISOString(),
      createdAt: new Date(2025, 1, 5).toISOString(),
      updatedAt: new Date(2025, 2, 1).toISOString(),
      deletedAt: null,
      history: [
        { fecha: new Date(2025, 1, 5).toISOString(), estado: 'pendiente' },
        { fecha: new Date(2025, 2, 1).toISOString(), estado: 'pagada' },
      ],
    },
    {
      companyId,
      propietarioId: 'prop-1',
      propietarioNombre: 'Juan García López',
      propietarioEmail: 'juan.garcia@email.com',
      inmuebleId: 'inv-2',
      inmuebleNombre: 'Calle Mayor 10, 2B',
      inmuebleDireccion: 'Calle Mayor 10, 2B, 28013 Madrid',
      periodoMes: 1,
      periodoAnio: 2025,
      rentaCobrada: 1100,
      honorariosGestion: 10,
      honorariosMonto: 110,
      gastosRepercutibles: 60,
      otrosGastos: 0,
      netoAPagar: 930,
      estado: 'pagada',
      notas: '',
      fechaPago: new Date(2025, 1, 5).toISOString(),
      createdAt: new Date(2025, 0, 8).toISOString(),
      updatedAt: new Date(2025, 1, 5).toISOString(),
      deletedAt: null,
      history: [
        { fecha: new Date(2025, 0, 8).toISOString(), estado: 'pendiente' },
        { fecha: new Date(2025, 1, 5).toISOString(), estado: 'pagada' },
      ],
    },
    {
      companyId,
      propietarioId: 'prop-3',
      propietarioNombre: 'Carlos Martínez Sánchez',
      propietarioEmail: 'carlos.martinez@email.com',
      inmuebleId: 'inv-4',
      inmuebleNombre: 'Plaza Central 7, Bajo',
      inmuebleDireccion: 'Plaza Central 7, Bajo, 08001 Barcelona',
      periodoMes: 2,
      periodoAnio: 2025,
      rentaCobrada: 850,
      honorariosGestion: 8,
      honorariosMonto: 68,
      gastosRepercutibles: 35,
      otrosGastos: 0,
      netoAPagar: 747,
      estado: 'pendiente',
      notas: '',
      fechaPago: null,
      createdAt: new Date(2025, 1, 6).toISOString(),
      updatedAt: new Date(2025, 1, 6).toISOString(),
      deletedAt: null,
      history: [{ fecha: new Date(2025, 1, 6).toISOString(), estado: 'pendiente' }],
    },
    {
      companyId,
      propietarioId: 'prop-4',
      propietarioNombre: 'Ana Rodríguez Pérez',
      propietarioEmail: 'ana.rodriguez@email.com',
      inmuebleId: 'inv-5',
      inmuebleNombre: 'Calle Nueva 22, 4C',
      inmuebleDireccion: 'Calle Nueva 22, 4C, 41001 Sevilla',
      periodoMes: 1,
      periodoAnio: 2025,
      rentaCobrada: 720,
      honorariosGestion: 10,
      honorariosMonto: 72,
      gastosRepercutibles: 28,
      otrosGastos: 0,
      netoAPagar: 620,
      estado: 'anulada',
      notas: 'Error en datos de cobro',
      fechaPago: null,
      createdAt: new Date(2025, 0, 10).toISOString(),
      updatedAt: new Date(2025, 0, 15).toISOString(),
      deletedAt: new Date(2025, 0, 15).toISOString(),
      history: [
        { fecha: new Date(2025, 0, 10).toISOString(), estado: 'pendiente' },
        { fecha: new Date(2025, 0, 15).toISOString(), estado: 'anulada', nota: 'Error en datos de cobro' },
      ],
    },
  ];

  samples.forEach((s, i) => {
    const id = `liq-mock-${i + 1}`;
    liquidacionesStore.set(id, { ...s, id });
  });
}

const createLiquidacionSchema = z.object({
  propietarioId: z.string().min(1),
  propietarioNombre: z.string().min(1),
  propietarioEmail: z.string().email().optional().default(''),
  inmuebleId: z.string().min(1),
  inmuebleNombre: z.string().min(1),
  inmuebleDireccion: z.string().optional().default(''),
  periodoMes: z.number().min(1).max(12),
  periodoAnio: z.number().min(2020).max(2030),
  rentaCobrada: z.number().min(0),
  honorariosGestion: z.number().min(0).max(100).default(10),
  gastosRepercutibles: z.number().min(0).default(0),
  otrosGastos: z.number().min(0).default(0),
  notas: z.string().optional().default(''),
});

function generateId(): string {
  return `liq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function calculateNeto(
  rentaCobrada: number,
  honorariosGestion: number,
  gastosRepercutibles: number,
  otrosGastos: number
): { honorariosMonto: number; netoAPagar: number } {
  const honorariosMonto = (rentaCobrada * honorariosGestion) / 100;
  const netoAPagar = rentaCobrada - honorariosMonto - gastosRepercutibles - otrosGastos;
  return { honorariosMonto, netoAPagar };
}

export function getAllLiquidaciones(companyId: string): Liquidacion[] {
  return Array.from(liquidacionesStore.values()).filter(
    (l) => l.companyId === companyId && !l.deletedAt
  );
}

export function getLiquidacionById(id: string): Liquidacion | undefined {
  const l = liquidacionesStore.get(id);
  return l && !l.deletedAt ? l : undefined;
}

export function createLiquidacion(
  companyId: string,
  data: z.infer<typeof createLiquidacionSchema>
): Liquidacion {
  const { honorariosMonto, netoAPagar } = calculateNeto(
    data.rentaCobrada,
    data.honorariosGestion,
    data.gastosRepercutibles,
    data.otrosGastos
  );

  const now = new Date().toISOString();
  const liquidacion: Liquidacion = {
    id: generateId(),
    companyId,
    propietarioId: data.propietarioId,
    propietarioNombre: data.propietarioNombre,
    propietarioEmail: data.propietarioEmail || '',
    inmuebleId: data.inmuebleId,
    inmuebleNombre: data.inmuebleNombre,
    inmuebleDireccion: data.inmuebleDireccion || data.inmuebleNombre,
    periodoMes: data.periodoMes,
    periodoAnio: data.periodoAnio,
    rentaCobrada: data.rentaCobrada,
    honorariosGestion: data.honorariosGestion,
    honorariosMonto,
    gastosRepercutibles: data.gastosRepercutibles,
    otrosGastos: data.otrosGastos,
    netoAPagar,
    estado: 'pendiente',
    notas: data.notas || '',
    fechaPago: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    history: [{ fecha: now, estado: 'pendiente' }],
  };

  liquidacionesStore.set(liquidacion.id, liquidacion);
  return liquidacion;
}

export function updateLiquidacion(
  id: string,
  updates: { estado?: LiquidacionEstado; notas?: string }
): Liquidacion | null {
  const l = liquidacionesStore.get(id);
  if (!l || l.deletedAt) return null;

  const now = new Date().toISOString();
  if (updates.estado !== undefined && updates.estado !== l.estado) {
    l.history.push({
      fecha: now,
      estado: updates.estado,
      nota: updates.notas,
    });
    l.estado = updates.estado;
    if (updates.estado === 'pagada') l.fechaPago = now;
    if (updates.estado === 'anulada') l.fechaPago = null;
  }
  if (updates.notas !== undefined) l.notas = updates.notas;
  l.updatedAt = now;

  liquidacionesStore.set(id, l);
  return l;
}

export function softDeleteLiquidacion(id: string): boolean {
  const l = liquidacionesStore.get(id);
  if (!l || l.deletedAt) return false;

  l.deletedAt = new Date().toISOString();
  l.estado = 'anulada';
  l.updatedAt = l.deletedAt;
  l.history.push({ fecha: l.deletedAt, estado: 'anulada', nota: 'Eliminada' });
  liquidacionesStore.set(id, l);
  return true;
}

function toApiFormat(l: Liquidacion) {
  return {
    id: l.id,
    propietario: { nombre: l.propietarioNombre, email: l.propietarioEmail },
    inmueble: { nombre: l.inmuebleNombre, direccion: l.inmuebleDireccion },
    periodo: `${MESES[l.periodoMes]} ${l.periodoAnio}`,
    periodoMes: l.periodoMes,
    periodoAnio: l.periodoAnio,
    rentaCobrada: l.rentaCobrada,
    honorariosGestion: l.honorariosGestion,
    honorariosMonto: l.honorariosMonto,
    gastosRepercutidos: l.gastosRepercutibles + l.otrosGastos,
    importeNeto: l.netoAPagar,
    estado: l.estado,
    fechaCreacion: l.createdAt,
    fechaPago: l.fechaPago,
    propietarioId: l.propietarioId,
    inmuebleId: l.inmuebleId,
    notas: l.notas,
    history: l.history,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId as string;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    seedMockLiquidaciones(companyId);

    const { searchParams } = new URL(req.url);
    const propietarioId = searchParams.get('propietarioId');
    const inmuebleId = searchParams.get('inmuebleId');
    const estado = searchParams.get('estado') as LiquidacionEstado | null;
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    let liquidaciones = getAllLiquidaciones(companyId);

    if (propietarioId) {
      liquidaciones = liquidaciones.filter((l) => l.propietarioId === propietarioId);
    }
    if (inmuebleId) {
      liquidaciones = liquidaciones.filter((l) => l.inmuebleId === inmuebleId);
    }
    if (estado) {
      liquidaciones = liquidaciones.filter((l) => l.estado === estado);
    }
    if (fechaDesde) {
      const [anio, mes] = fechaDesde.split('-').map(Number);
      liquidaciones = liquidaciones.filter(
        (l) => l.periodoAnio > anio || (l.periodoAnio === anio && l.periodoMes >= (mes || 1))
      );
    }
    if (fechaHasta) {
      const [anio, mes] = fechaHasta.split('-').map(Number);
      liquidaciones = liquidaciones.filter(
        (l) => l.periodoAnio < anio || (l.periodoAnio === anio && l.periodoMes <= (mes || 12))
      );
    }

    liquidaciones.sort(
      (a, b) =>
        b.periodoAnio - a.periodoAnio || b.periodoMes - a.periodoMes || b.createdAt.localeCompare(a.createdAt)
    );

    const total = liquidaciones.length;
    const start = (page - 1) * limit;
    const paginatedData = liquidaciones.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData.map(toApiFormat),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('[Liquidaciones GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener liquidaciones' },
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

    const companyId = session.user.companyId as string;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createLiquidacionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const liquidacion = createLiquidacion(companyId, validationResult.data);

    return NextResponse.json(
      {
        success: true,
        data: liquidacion,
        message: 'Liquidación creada correctamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[Liquidaciones POST]:', error);
    return NextResponse.json(
      { error: 'Error al crear liquidación' },
      { status: 500 }
    );
  }
}

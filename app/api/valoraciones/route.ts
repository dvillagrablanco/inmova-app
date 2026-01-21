import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const valoracionCreateSchema = z.object({
  unitId: z.string().optional(),
  direccion: z.string().min(1, 'La dirección es requerida').trim(),
  municipio: z.string().min(1, 'El municipio es requerido').trim(),
  provincia: z.string().min(1, 'La provincia es requerida').trim(),
  codigoPostal: z.string().trim().optional(),
  metrosCuadrados: z.union([z.number(), z.string()]),
  habitaciones: z.union([z.number(), z.string()]).optional(),
  banos: z.union([z.number(), z.string()]).optional(),
  garajes: z.union([z.number(), z.string()]).optional(),
  ascensor: z.boolean().optional(),
  terraza: z.boolean().optional(),
  piscina: z.boolean().optional(),
  estadoConservacion: z.enum(['excelente', 'bueno', 'aceptable', 'reformar']).optional(),
  finalidad: z.enum(['venta', 'alquiler', 'seguro', 'hipoteca']).optional(),
});

type ValoracionCreateInput = z.infer<typeof valoracionCreateSchema>;

interface ValoracionResponse {
  id: string;
  unitId?: string | null;
  buildingId?: string | null;
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal?: string | null;
  metrosCuadrados: number;
  habitaciones?: number | null;
  banos?: number | null;
  garajes?: number | null;
  ascensor: boolean;
  terraza: boolean;
  piscina: boolean;
  estadoConservacion?: string | null;
  finalidad: 'venta' | 'alquiler' | 'seguro' | 'hipoteca';
  metodo: 'comparables' | 'renta' | 'coste' | 'mixto';
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  precioM2: number;
  confianzaValoracion: number;
  fechaValoracion: string;
  createdAt: string;
  updatedAt: string;
}

const parseNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIntSafe = (value: number | string | undefined): number | undefined => {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
};

const normalizeBoolean = (value?: boolean): boolean => Boolean(value);

const buildResponse = (val: {
  id: string;
  unitId: string | null;
  buildingId: string | null;
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal: string | null;
  metrosCuadrados: number;
  habitaciones: number | null;
  banos: number | null;
  garajes: number | null;
  ascensor: boolean;
  terraza: boolean;
  piscina: boolean;
  estadoConservacion: string | null;
  finalidad: 'venta' | 'alquiler' | 'seguro' | 'hipoteca';
  metodo: 'comparables' | 'renta' | 'coste' | 'mixto';
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  precioM2: number;
  confianzaValoracion: number;
  fechaValoracion: Date;
  createdAt: Date;
  updatedAt: Date;
}): ValoracionResponse => ({
  id: val.id,
  unitId: val.unitId,
  buildingId: val.buildingId,
  direccion: val.direccion,
  municipio: val.municipio,
  provincia: val.provincia,
  codigoPostal: val.codigoPostal,
  metrosCuadrados: Number(val.metrosCuadrados),
  habitaciones: val.habitaciones,
  banos: val.banos,
  garajes: val.garajes,
  ascensor: val.ascensor,
  terraza: val.terraza,
  piscina: val.piscina,
  estadoConservacion: val.estadoConservacion,
  finalidad: val.finalidad,
  metodo: val.metodo,
  valorEstimado: Number(val.valorEstimado),
  valorMinimo: Number(val.valorMinimo),
  valorMaximo: Number(val.valorMaximo),
  precioM2: Number(val.precioM2),
  confianzaValoracion: Number(val.confianzaValoracion),
  fechaValoracion: val.fechaValoracion.toISOString(),
  createdAt: val.createdAt.toISOString(),
  updatedAt: val.updatedAt.toISOString(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json([], { status: 200 });
    }

    const valuations = await prisma.valoracionPropiedad.findMany({
      where: { companyId },
      orderBy: { fechaValoracion: 'desc' },
    });

    const mapped = valuations.map((val) =>
      buildResponse({
        id: val.id,
        unitId: val.unitId,
        buildingId: val.buildingId,
        direccion: val.direccion,
        municipio: val.municipio,
        provincia: val.provincia,
        codigoPostal: val.codigoPostal,
        metrosCuadrados: Number(val.metrosCuadrados),
        habitaciones: val.habitaciones ?? null,
        banos: val.banos ?? null,
        garajes: val.garajes ?? null,
        ascensor: val.ascensor,
        terraza: val.terraza,
        piscina: val.piscina,
        estadoConservacion: val.estadoConservacion ?? null,
        finalidad: val.finalidad,
        metodo: val.metodo,
        valorEstimado: Number(val.valorEstimado),
        valorMinimo: Number(val.valorMinimo),
        valorMaximo: Number(val.valorMaximo),
        precioM2: Number(val.precioM2),
        confianzaValoracion: Number(val.confianzaValoracion),
        fechaValoracion: val.fechaValoracion,
        createdAt: val.createdAt,
        updatedAt: val.updatedAt,
      })
    );

    return NextResponse.json(mapped);
  } catch (error) {
    logger.error('[Valoraciones] Error obteniendo valoraciones', error);
    return NextResponse.json({ error: 'Error al obtener valoraciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = (await req.json()) as ValoracionCreateInput;
    const validationResult = valoracionCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('[Valoraciones] Datos inválidos', { errors });
      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const metrosCuadrados = parseNumber(data.metrosCuadrados);

    if (!metrosCuadrados || metrosCuadrados <= 0) {
      return NextResponse.json(
        { error: 'metrosCuadrados debe ser mayor que 0' },
        { status: 400 }
      );
    }

    const habitaciones = parseIntSafe(data.habitaciones);
    const banos = parseIntSafe(data.banos);
    const garajes = parseIntSafe(data.garajes);

    let buildingId: string | null = null;
    let resolvedUnitId: string | null = data.unitId || null;

    if (data.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: data.unitId },
        select: {
          id: true,
          buildingId: true,
          building: { select: { companyId: true } },
        },
      });

      if (!unit || unit.building.companyId !== companyId) {
        return NextResponse.json(
          { error: 'Unidad no encontrada o sin acceso' },
          { status: 404 }
        );
      }

      buildingId = unit.buildingId;
      resolvedUnitId = unit.id;
    }

    const comparables = await prisma.valoracionPropiedad.findMany({
      where: {
        companyId,
        municipio: {
          equals: data.municipio,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        direccion: true,
        metrosCuadrados: true,
        valorEstimado: true,
        precioM2: true,
        confianzaValoracion: true,
      },
      orderBy: { fechaValoracion: 'desc' },
      take: 5,
    });

    const avgComparablePrice =
      comparables.length > 0
        ? comparables.reduce((sum, item) => sum + Number(item.precioM2 || 0), 0) / comparables.length
        : undefined;

    const rentSamples = await prisma.unit.findMany({
      where: {
        building: { companyId },
        superficie: { gt: 0 },
        rentaMensual: { gt: 0 },
      },
      select: {
        superficie: true,
        rentaMensual: true,
      },
      take: 50,
    });

    const avgRentPerM2 =
      rentSamples.length > 0
        ? rentSamples.reduce((sum, item) => sum + Number(item.rentaMensual) / Number(item.superficie), 0) / rentSamples.length
        : undefined;

    const capRate = 0.05;
    const finalidad = data.finalidad || 'venta';

    let metodo: 'comparables' | 'renta' | 'coste' | 'mixto' = 'coste';
    let precioM2: number;

    if (avgComparablePrice && avgComparablePrice > 0) {
      metodo = 'comparables';
      precioM2 = avgComparablePrice;
    } else if (avgRentPerM2 && avgRentPerM2 > 0) {
      metodo = finalidad === 'alquiler' ? 'renta' : 'mixto';
      precioM2 = finalidad === 'alquiler' ? avgRentPerM2 : (avgRentPerM2 * 12) / capRate;
    } else {
      const base = 1200;
      const bonusHabitaciones = (habitaciones || 0) * 75;
      const bonusBanos = (banos || 0) * 90;
      const bonusGarajes = (garajes || 0) * 60;
      const bonusAscensor = data.ascensor ? 60 : 0;
      const bonusTerraza = data.terraza ? 70 : 0;
      const bonusPiscina = data.piscina ? 120 : 0;
      const conservacionFactor =
        data.estadoConservacion === 'excelente'
          ? 1.15
          : data.estadoConservacion === 'aceptable'
            ? 0.95
            : data.estadoConservacion === 'reformar'
              ? 0.85
              : 1.05;

      precioM2 = (base + bonusHabitaciones + bonusBanos + bonusGarajes + bonusAscensor + bonusTerraza + bonusPiscina) * conservacionFactor;
      metodo = 'coste';
    }

    const valorEstimado = Math.round(precioM2 * metrosCuadrados);
    const valorMinimo = Math.round(valorEstimado * 0.9);
    const valorMaximo = Math.round(valorEstimado * 1.1);

    const confianzaValoracion =
      comparables.length >= 5
        ? 85
        : comparables.length >= 3
          ? 75
          : comparables.length >= 1
            ? 65
            : 55;

    const factoresPositivos: string[] = [];
    const factoresNegativos: string[] = [];

    if (data.ascensor) factoresPositivos.push('Ascensor');
    if (data.terraza) factoresPositivos.push('Terraza');
    if (data.piscina) factoresPositivos.push('Piscina');
    if (garajes && garajes > 0) factoresPositivos.push('Garaje');
    if (data.estadoConservacion === 'reformar') factoresNegativos.push('Requiere reforma');

    const saved = await prisma.valoracionPropiedad.create({
      data: {
        companyId,
        unitId: resolvedUnitId,
        buildingId,
        direccion: data.direccion,
        municipio: data.municipio,
        provincia: data.provincia,
        codigoPostal: data.codigoPostal || null,
        metrosCuadrados,
        habitaciones: habitaciones ?? null,
        banos: banos ?? null,
        garajes: garajes ?? null,
        ascensor: normalizeBoolean(data.ascensor),
        terraza: normalizeBoolean(data.terraza),
        piscina: normalizeBoolean(data.piscina),
        estadoConservacion: data.estadoConservacion || null,
        metodo,
        finalidad,
        valorEstimado,
        valorMinimo,
        valorMaximo,
        precioM2: Math.round(precioM2 * 100) / 100,
        confianzaValoracion,
        numComparables: comparables.length,
        comparablesData: comparables,
        factoresPositivos,
        factoresNegativos,
        recomendacionPrecio: 'Valoración generada con datos internos disponibles.',
        precioMedioZona: avgComparablePrice || null,
        generadoPor: user.id,
        fechaValoracion: new Date(),
      },
    });

    logger.info('[Valoraciones] Valoración creada', { valuationId: saved.id, companyId });

    return NextResponse.json(buildResponse(saved), { status: 201 });
  } catch (error: unknown) {
    logger.error('[Valoraciones] Error creando valoración', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear valoración' }, { status: 500 });
  }
}

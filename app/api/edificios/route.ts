import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { invalidateBuildingsCache, invalidateUnitsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const edificioCreateSchema = z.object({
  nombre: z.string().trim().optional(),
  direccion: z.string().min(1, 'La dirección es requerida').trim(),
  ciudad: z.string().min(1, 'La ciudad es requerida').trim(),
  provincia: z.string().min(1, 'La provincia es requerida').trim(),
  codigoPostal: z.string().trim().optional(),
  tipo: z.enum(['residencial', 'comercial', 'mixto', 'otro']).optional(),
  referencia: z.string().trim().optional(),
  superficie: z.union([z.number(), z.string()]).optional(),
  habitaciones: z.union([z.number(), z.string()]).optional(),
  banos: z.union([z.number(), z.string()]).optional(),
  planta: z.union([z.number(), z.string()]).optional(),
  ascensor: z.union([z.boolean(), z.string()]).optional(),
  parking: z.union([z.boolean(), z.string()]).optional(),
  ownerName: z.string().trim().optional(),
  ownerEmail: z.string().trim().optional(),
  ownerPhone: z.string().trim().optional(),
});

type EdificioCreateInput = z.infer<typeof edificioCreateSchema>;

const parseNumber = (value?: number | string): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIntSafe = (value?: number | string): number | undefined => {
  const parsed = parseNumber(value);
  if (parsed === undefined) return undefined;
  return Math.trunc(parsed);
};

const parseBoolean = (value?: boolean | string): boolean => {
  if (value === true || value === 'true') return true;
  return false;
};

const normalizeBuildingType = (tipo?: EdificioCreateInput['tipo']): 'residencial' | 'comercial' | 'mixto' => {
  if (tipo === 'comercial') return 'comercial';
  if (tipo === 'mixto') return 'mixto';
  return 'residencial';
};

const resolveUnitType = (buildingType: 'residencial' | 'comercial' | 'mixto'): 'vivienda' | 'local' => {
  return buildingType === 'comercial' ? 'local' : 'vivienda';
};

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID no encontrado' },
        { status: 400 }
      );
    }

    const body = (await req.json()) as EdificioCreateInput;
    const validationResult = edificioCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('[Edificios] Datos inválidos', { errors });
      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const buildingType = normalizeBuildingType(data.tipo);
    const unitType = resolveUnitType(buildingType);
    const unitNumber = data.referencia?.trim() || 'Unidad 1';

    const buildingName =
      data.nombre?.trim() ||
      data.referencia?.trim() ||
      data.direccion.trim();

    const superficie = parseNumber(data.superficie) ?? 0;
    const habitaciones = parseIntSafe(data.habitaciones);
    const banos = parseIntSafe(data.banos);
    const planta = parseIntSafe(data.planta);
    const hasElevator = parseBoolean(data.ascensor);
    const hasParking = parseBoolean(data.parking);

    const result = await prisma.$transaction(async (tx) => {
      const building = await tx.building.create({
        data: {
          companyId,
          nombre: buildingName,
          direccion: data.direccion,
          tipo: buildingType,
          anoConstructor: new Date().getFullYear(),
          numeroUnidades: 1,
          ascensor: hasElevator,
          garaje: hasParking,
        },
      });

      const unit = await tx.unit.create({
        data: {
          buildingId: building.id,
          numero: unitNumber,
          tipo: unitType,
          estado: 'disponible',
          superficie,
          habitaciones: habitaciones ?? null,
          banos: banos ?? null,
          planta: planta ?? null,
          rentaMensual: 0,
        },
      });

      return { building, unit };
    });

    await invalidateBuildingsCache(companyId);
    await invalidateUnitsCache(companyId);
    await invalidateDashboardCache(companyId);

    logger.info('[Edificios] Edificio y unidad creados', {
      buildingId: result.building.id,
      unitId: result.unit.id,
      companyId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error('[Edificios] Error creando edificio', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear edificio' },
      { status: 500 }
    );
  }
}

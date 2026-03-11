import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  getUserCompany,
  requirePermission,
  forbiddenResponse,
  badRequestResponse,
} from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { buildingCreateSchema } from '@/lib/validations';
import {
  cachedBuildings,
  invalidateBuildingsCache,
  invalidateDashboardCache,
} from '@/lib/api-cache-helpers';
import { resolveCompanyScope } from '@/lib/company-scope';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();

    // Redis cache (2 min TTL)
    try {
      const { get, set } = await import('@/lib/cache-service');
      const cacheKey = `buildings:${user.companyId}`;
      const cached = await get(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch {} // Redis not configured

    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause = { companyId: { in: scope.scopeCompanyIds } };

    const buildingQuery: any = {
      where: whereClause,
      include: {
        units: {
          select: {
            id: true,
            estado: true,
            rentaMensual: true,
            valorMercado: true,
            precioCompra: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    };

    if (usePagination) {
      buildingQuery.skip = skip;
      buildingQuery.take = limit;
    }

    const [buildings, total] = await Promise.all([
      prisma.building.findMany(buildingQuery),
      prisma.building.count({ where: whereClause }),
    ]);

    // Calcular métricas para cada edificio
    const buildingsWithMetrics = buildings.map((building: any) => {
      const totalUnits = building.units.length;
      const occupiedUnits = building.units.filter((u: any) => u.estado === 'ocupada').length;
      const ocupacionPct = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      const ingresosMensuales = building.units
        .filter((u: any) => u.estado === 'ocupada')
        .reduce((sum: number, u: any) => sum + Number(u.rentaMensual || 0), 0);

      return {
        id: building.id,
        nombre: building.nombre,
        direccion: building.direccion,
        tipo: building.tipo,
        anoConstructor: building.anoConstructor,
        numeroUnidades: building.numeroUnidades,
        companyId: building.companyId,
        company: (building as any).company,
        ibiAnual: null,
        latitud: null,
        longitud: null,
        createdAt: building.createdAt,
        updatedAt: building.updatedAt,
        totalUnidades: totalUnits,
        unidadesOcupadas: occupiedUnits,
        unidadesDisponibles: totalUnits - occupiedUnits,
        metrics: {
          totalUnits,
          occupiedUnits,
          ocupacionPct: Number((Math.round(ocupacionPct * 10) / 10).toFixed(1)),
          ingresosMensuales: Number((Math.round(ingresosMensuales * 100) / 100).toFixed(2)),
          // Yield por edificio
          valorMercado: building.units.reduce((s: number, u: any) => s + (u.valorMercado || 0), 0),
          precioCompra: building.units.reduce((s: number, u: any) => s + (u.precioCompra || 0), 0),
          yieldBruto: (() => {
            const vm = building.units.reduce((s: number, u: any) => s + (u.valorMercado || 0), 0);
            return vm > 0 ? Number(((ingresosMensuales * 12 / vm) * 100).toFixed(1)) : 0;
          })(),
        },
      };
    });

    if (!usePagination) {
      return NextResponse.json(buildingsWithMetrics);
    }

    return NextResponse.json({
      data: buildingsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 });
    }
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching buildings:', {
      message: errorMessage,
      stack: errorStack.slice(0, 500),
    });
    Sentry.captureException(error);

    if (errorMessage === 'No autenticado') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (errorMessage === 'Usuario inactivo') {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al obtener edificios', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requirePermission('create');
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await req.json();

    // Validación con Zod
    const validationResult = buildingCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating building:', { errors });
      return NextResponse.json({ error: 'Datos inv\u00e1lidos', details: errors }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Build create data with only fields that exist in the DB schema
    const createData: any = {
      companyId: scope.activeCompanyId,
      nombre: validatedData.nombre,
      direccion: validatedData.direccion,
      tipo:
        validatedData.tipo && ['residencial', 'mixto', 'comercial'].includes(validatedData.tipo)
          ? (validatedData.tipo as 'residencial' | 'mixto' | 'comercial')
          : 'residencial',
      anoConstructor: validatedData.anoConstructor || new Date().getFullYear(),
      numeroUnidades: validatedData.numeroUnidades || 0,
    };

    const building = await prisma.building.create({ data: createData });

    // Invalidar cachés relacionados
    await invalidateBuildingsCache(scope.activeCompanyId);
    await invalidateDashboardCache(scope.activeCompanyId);

    logger.info('Building created successfully', {
      buildingId: building.id,
      companyId: scope.activeCompanyId,
    });

    // 🚀 AUTO-PUBLICACIÓN EN REDES SOCIALES (async, no bloqueante)
    const userId = user.id;
    (async () => {
      try {
        const { autoPublishProperty } = await import('@/lib/social-media-service');
        await autoPublishProperty(
          scope.activeCompanyId,
          userId,
          {
            type: 'building',
            id: building.id,
            name: building.nombre,
            address: building.direccion || undefined,
          },
          {
            scheduleMinutesDelay: 5, // Publicar en 5 minutos para permitir agregar foto
          }
        );
      } catch (socialError) {
        // No queremos que falle la creación si falla la publicación social
        logger.error('Error en autopublicación de edificio:', socialError);
        Sentry.captureException(socialError);
      }
    })();

    return NextResponse.json(building, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 });
    }
    logError(error, { context: 'Error creating building' });
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear edificio' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserCompany, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { buildingCreateSchema } from '@/lib/validations';
import { cachedBuildings, invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { resolveCompanyScope } from '@/lib/company-scope';

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
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    // Si no hay paginación solicitada (página 1 con limit 10 o sin params), usar cache
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    
    if (!usePagination && scope.scopeCompanyIds.length === 1) {
      const buildingsWithMetrics = await cachedBuildings(scope.activeCompanyId);
      return NextResponse.json(buildingsWithMetrics);
    }

    const whereClause =
      scope.scopeCompanyIds.length > 1
        ? { companyId: { in: scope.scopeCompanyIds } }
        : { companyId: scope.activeCompanyId };
    
    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where: whereClause,
        include: {
          units: {
            select: {
              id: true,
              estado: true,
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
        skip,
        take: limit,
      }),
      prisma.building.count({
        where: whereClause,
      }),
    ]);

    // Calcular métricas para cada edificio
    const buildingsWithMetrics = buildings.map(building => {
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
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching buildings:', { message: errorMessage, stack: errorStack.slice(0, 500) });
    
    if (errorMessage === 'No autenticado') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (errorMessage === 'Usuario inactivo') {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: 'Error al obtener edificios', details: errorMessage }, { status: 500 });
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
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating building:', { errors });
      return NextResponse.json(
        { error: 'Datos inv\u00e1lidos', details: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const building = await prisma.building.create({
      data: {
        companyId: scope.activeCompanyId,
        nombre: validatedData.nombre,
        direccion: validatedData.direccion,
        tipo: (validatedData.tipo && ['residencial', 'mixto', 'comercial'].includes(validatedData.tipo)) ? validatedData.tipo as 'residencial' | 'mixto' | 'comercial' : 'residencial',
        anoConstructor: validatedData.anoConstructor || new Date().getFullYear(),
        numeroUnidades: validatedData.numeroUnidades || 0,
      },
    });

    // Invalidar cachés relacionados
    await invalidateBuildingsCache(scope.activeCompanyId);
    await invalidateDashboardCache(scope.activeCompanyId);

    logger.info('Building created successfully', { buildingId: building.id, companyId: scope.activeCompanyId });

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
            scheduleMinutesDelay: 5 // Publicar en 5 minutos para permitir agregar foto
          }
        );
      } catch (socialError) {
        // No queremos que falle la creación si falla la publicación social
        logger.error('Error en autopublicación de edificio:', socialError);
      }
    })();

    return NextResponse.json(building, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
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

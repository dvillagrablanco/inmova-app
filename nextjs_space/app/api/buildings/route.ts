import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getUserCompany, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { buildingCreateSchema } from '@/lib/validations';
import { cachedBuildings, invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Si no hay paginación solicitada (página 1 con limit 10 o sin params), usar cache
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    
    if (!usePagination) {
      // Usar datos cacheados para vista completa (por compatibilidad)
      const buildingsWithMetrics = await cachedBuildings(companyId);
      return NextResponse.json(buildingsWithMetrics);
    }

    // Paginación: consulta directa sin cache
    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where: { companyId },
        include: {
          units: {
            select: {
              id: true,
              estado: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.building.count({
        where: { companyId },
      }),
    ]);

    // Calcular métricas para cada edificio
    const buildingsWithMetrics = buildings.map(building => ({
      ...building,
      totalUnidades: building.units.length,
      unidadesOcupadas: building.units.filter((u: any) => u.estado === 'ocupada').length,
      unidadesDisponibles: building.units.filter((u: any) => u.estado === 'disponible').length,
    }));

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
    logger.error('Error fetching buildings:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener edificios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

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
        companyId,
        nombre: validatedData.nombre,
        direccion: validatedData.direccion,
        tipo: (validatedData.tipo && ['residencial', 'mixto', 'comercial'].includes(validatedData.tipo)) ? validatedData.tipo as 'residencial' | 'mixto' | 'comercial' : 'residencial',
        anoConstructor: validatedData.anoConstructor || new Date().getFullYear(),
        numeroUnidades: validatedData.numeroUnidades || 0,
      },
    });

    // Invalidar cachés relacionados
    await invalidateBuildingsCache(companyId);
    await invalidateDashboardCache(companyId);

    logger.info('Building created successfully', { buildingId: building.id, companyId });

    // 🚀 AUTO-PUBLICACIÓN EN REDES SOCIALES (async, no bloqueante)
    const userId = user.id;
    (async () => {
      try {
        const { autoPublishProperty } = await import('@/lib/social-media-service');
        await autoPublishProperty(
          companyId,
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

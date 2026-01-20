import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { unitCreateSchema } from '@/lib/validations';
import { cachedUnits, invalidateUnitsCache, invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { getPaginationParams, buildPaginationResponse } from '@/lib/pagination-helper';
import { selectBuildingMinimal, selectTenantMinimal, selectContractMinimal } from '@/lib/query-optimizer';
import { checkCanCreate } from '@/lib/plan-limits-checker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    const userRole = session.user?.role;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'soporte';
    
    // Si no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !companyId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const filterCompanyId = searchParams.get('companyId');
    const usePagination = searchParams.get('paginate') === 'true';

    // Determinar el filtro de empresa
    const whereCompanyId = isSuperAdmin 
      ? (filterCompanyId || undefined) 
      : companyId;

    // Si hay filtros o se solicita paginación, no usar caché
    const hasFilters = buildingId || estado || tipo;

    if (hasFilters || usePagination) {
      const where: any = whereCompanyId ? { building: { companyId: whereCompanyId } } : {};
      if (buildingId) where.buildingId = buildingId;
      if (estado) where.estado = estado;
      // Soportar múltiples tipos separados por comas (ej: garaje,trastero)
      if (tipo) {
        const tipos = tipo.split(',').map(t => t.trim());
        if (tipos.length === 1) {
          where.tipo = tipos[0];
        } else {
          where.tipo = { in: tipos };
        }
      }

      // Paginación si se solicita
      if (usePagination) {
        const { skip, take, page, limit } = getPaginationParams(searchParams);
        
        const [units, total] = await Promise.all([
          prisma.unit.findMany({
            where,
            select: {
              id: true,
              numero: true,
              tipo: true,
              estado: true,
              planta: true,
              superficie: true,
              habitaciones: true,
              banos: true,
              rentaMensual: true,
              createdAt: true,
              building: {
                select: selectBuildingMinimal,
              },
              contracts: {
                where: { estado: 'activo' },
                take: 1,
                include: {
                  tenant: {
                    select: selectTenantMinimal,
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
          }),
          prisma.unit.count({ where }),
        ]);

        // Transformar estructura para extraer tenant del contrato
        const transformedUnits = units.map((unit) => ({
          ...unit,
          superficie: Number(unit.superficie || 0),
          rentaMensual: Number(unit.rentaMensual || 0),
          tenant: unit.contracts?.[0]?.tenant || null,
          contracts: undefined, // Remover contracts del resultado
        }));

        return NextResponse.json(buildPaginationResponse(transformedUnits, total, page, limit));
      }

      // Sin paginación pero con filtros
      const units = await prisma.unit.findMany({
        where,
        select: {
          id: true,
          numero: true,
          tipo: true,
          estado: true,
          planta: true,
          superficie: true,
          habitaciones: true,
          banos: true,
          rentaMensual: true,
          createdAt: true,
          building: {
            select: selectBuildingMinimal,
          },
          contracts: {
            where: { estado: 'activo' },
            take: 1,
            include: {
              tenant: {
                select: selectTenantMinimal,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transformar estructura para extraer tenant del contrato
      const transformedUnits = units.map((unit) => ({
        ...unit,
        superficie: Number(unit.superficie || 0),
        rentaMensual: Number(unit.rentaMensual || 0),
        tenant: unit.contracts?.[0]?.tenant || null,
        contracts: undefined, // Remover contracts del resultado
      }));

      return NextResponse.json(transformedUnits);
    }

    // Sin filtros, usar caché (compatibilidad con código existente)
    // Para super_admin sin filtro de empresa, retornar lista vacía (debe seleccionar empresa)
    if (!whereCompanyId) {
      return NextResponse.json([]);
    }
    
    const units = await cachedUnits(whereCompanyId);
    return NextResponse.json(units);
  } catch (error) {
    logger.error('Error fetching units:', error);
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;

    // Verificar límites del plan antes de crear
    const limitCheck = await checkCanCreate('properties', companyId || undefined);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.message || 'Límite de propiedades alcanzado',
          code: 'PLAN_LIMIT_EXCEEDED',
          limit: limitCheck.limit,
          used: limitCheck.used,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Validación con Zod
    const validationResult = unitCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating unit:', { errors });
      return NextResponse.json(
        { error: 'Datos inv\u00e1lidos', details: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const unit = await prisma.unit.create({
      data: {
        buildingId: validatedData.buildingId,
        numero: validatedData.numero,
        tipo: validatedData.tipo || 'vivienda',
        estado: validatedData.estado || 'disponible',
        planta: typeof validatedData.piso === 'number' ? validatedData.piso : (typeof validatedData.piso === 'string' ? parseInt(validatedData.piso, 10) || null : null),
        superficie: typeof validatedData.superficie === 'number' ? validatedData.superficie : (typeof validatedData.superficie === 'string' ? parseFloat(validatedData.superficie) || 0 : 0),
        habitaciones: validatedData.habitaciones || null,
        banos: validatedData.banos || null,
        rentaMensual: validatedData.rentaMensual || 0,
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateUnitsCache(companyId);
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    logger.info('Unit created successfully', { unitId: unit.id, buildingId: validatedData.buildingId });

    // 🚀 AUTO-PUBLICACIÓN EN REDES SOCIALES (async, no bloqueante) 
    const userId = session?.user?.id;
    if (companyId && userId) {
      (async () => {
        try {
          const { autoPublishProperty } = await import('@/lib/social-media-service');
          
          // Obtener datos del edificio para el address
          const building = await prisma.building.findUnique({
            where: { id: validatedData.buildingId },
            select: { nombre: true, direccion: true }
          });

          await autoPublishProperty(
            companyId,
            userId,
            {
              type: 'unit',
              id: unit.id,
              name: `${building?.nombre || 'Propiedad'} - ${unit.numero}`,
              address: building?.direccion || undefined,
              precio: unit.rentaMensual || undefined,
              superficie: unit.superficie || undefined,
              habitaciones: unit.habitaciones || undefined,
            },
            {
              scheduleMinutesDelay: 10 // Publicar en 10 minutos para permitir agregar fotos
            }
          );
        } catch (socialError) {
          logger.error('Error en autopublicación de unidad:', socialError);
        }
      })();
    }

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating unit' });
    return NextResponse.json({ error: 'Error al crear unidad' }, { status: 500 });
  }
}

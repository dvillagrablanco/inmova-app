import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { unitCreateSchema } from '@/lib/validations';
import { cachedUnits, invalidateUnitsCache, invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { getPaginationParams, buildPaginationResponse } from '@/lib/pagination-helper';
import { selectBuildingMinimal, selectTenantMinimal, selectContractMinimal } from '@/lib/query-optimizer';
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const usePagination = searchParams.get('paginate') === 'true';

    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { building: { companyId: { in: scope.scopeCompanyIds } } }
        : { building: { companyId: scope.activeCompanyId } };

    // Si hay filtros o se solicita paginación, no usar caché
    const hasFilters = buildingId || estado || tipo;

    if (hasFilters || usePagination) {
      const where: any = { ...companyFilter };
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

    // Sin filtros, usar caché solo cuando hay una empresa activa
    if (scope.scopeCompanyIds.length !== 1) {
      const units = await prisma.unit.findMany({
        where: companyFilter,
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

      const transformedUnits = units.map((unit) => ({
        ...unit,
        superficie: Number(unit.superficie || 0),
        rentaMensual: Number(unit.rentaMensual || 0),
        tenant: unit.contracts?.[0]?.tenant || null,
        contracts: undefined,
      }));

      return NextResponse.json(transformedUnits);
    }

    const units = await cachedUnits(scope.activeCompanyId);
    return NextResponse.json(units);
  } catch (error) {
    logger.error('Error fetching units:', error);
      Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Error al obtener unidades' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

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
        gastosComunidad: validatedData.gastosComunidad ?? null,
        ibiAnual: validatedData.ibiAnual ?? null,
      },
    });

    // Invalidar cachés relacionados
    await invalidateUnitsCache(scope.activeCompanyId);
    await invalidateBuildingsCache(scope.activeCompanyId);
    await invalidateDashboardCache(scope.activeCompanyId);

    logger.info('Unit created successfully', { unitId: unit.id, buildingId: validatedData.buildingId });

    // 🚀 AUTO-PUBLICACIÓN EN REDES SOCIALES (async, no bloqueante) 
    const userId = session?.user?.id;
    if (scope.activeCompanyId && userId) {
      (async () => {
        try {
          const { autoPublishProperty } = await import('@/lib/social-media-service');
          
          // Obtener datos del edificio para el address
          const building = await prisma.building.findUnique({
            where: { id: validatedData.buildingId },
            select: { nombre: true, direccion: true }
          });

          await autoPublishProperty(
            scope.activeCompanyId,
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
      Sentry.captureException(error);
        }
      })();
    }

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating unit' });
    return NextResponse.json({ error: 'Error al crear unidad' }, { status: 500 });
  }
}

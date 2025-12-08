import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { unitCreateSchema } from '@/lib/validations';
import { cachedUnits, invalidateUnitsCache, invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    // Si hay filtros, no usar caché (por ahora)
    const hasFilters = buildingId || estado || tipo;

    if (hasFilters) {
      const where: any = { building: { companyId } };
      if (buildingId) where.buildingId = buildingId;
      if (estado) where.estado = estado;
      if (tipo) where.tipo = tipo;

      const units = await prisma.unit.findMany({
        where,
        include: {
          building: true,
          tenant: true,
          contracts: {
            where: { estado: 'activo' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(units);
    }

    // Sin filtros, usar caché
    const units = await cachedUnits(companyId);
    return NextResponse.json(units);
  } catch (error) {
    logger.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Error al obtener unidades' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const companyId = session.user?.companyId;

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
    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating unit' });
    return NextResponse.json({ error: 'Error al crear unidad' }, { status: 500 });
  }
}

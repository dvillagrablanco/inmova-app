import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getUserCompany, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { buildingCreateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: {
        units: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics for each building
    const buildingsWithMetrics = buildings.map((building) => {
      const totalUnits = building.units.length;
      const occupiedUnits = building.units.filter((u) => u.estado === 'ocupada').length;
      const ocupacionPct = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      const ingresosMensuales = building.units
        .filter((u) => u.estado === 'ocupada')
        .reduce((sum, u) => sum + u.rentaMensual, 0);

      return {
        ...building,
        metrics: {
          totalUnits,
          occupiedUnits,
          ocupacionPct: Math.round(ocupacionPct * 10) / 10,
          ingresosMensuales: Math.round(ingresosMensuales * 100) / 100,
        },
      };
    });

    return NextResponse.json(buildingsWithMetrics);
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

    logger.info('Building created successfully', { buildingId: building.id, companyId });
    return NextResponse.json(building, { status: 201 });
  } catch (error: any) {
    logError(error, 'Error creating building');
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear edificio' }, { status: 500 });
  }
}

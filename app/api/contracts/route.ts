import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { contractCreateSchema } from '@/lib/validations';
import { 
  cachedContracts, 
  invalidateContractsCache, 
  invalidateUnitsCache, 
  invalidateDashboardCache 
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

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    // Construir where clause
    const whereClause =
      scope.scopeCompanyIds.length > 1
        ? {
            unit: {
              building: {
                companyId: { in: scope.scopeCompanyIds },
              },
            },
          }
        : {
            unit: {
              building: {
                companyId: scope.activeCompanyId,
              },
            },
          };

    // Consulta directa (sin cache para evitar errores de build)
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: whereClause,
        include: {
          unit: {
            include: {
              building: {
                include: {
                  company: {
                    select: { id: true, nombre: true },
                  },
                },
              },
            },
          },
          tenant: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({
        where: whereClause,
      }),
    ]);

    // Calcular días hasta vencimiento y convertir valores Decimal
    const contractsWithExpiration = contracts.map(contract => {
      const fechaFin = contract.fechaFin ? new Date(contract.fechaFin) : null;
      const daysUntilExpiration = fechaFin
        ? Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        id: contract.id,
        unitId: contract.unitId,
        tenantId: contract.tenantId,
        fechaInicio: contract.fechaInicio,
        fechaFin: contract.fechaFin,
        rentaMensual: Number(contract.rentaMensual || 0),
        deposito: Number(contract.deposito || 0),
        estado: contract.estado,
        tipo: contract.tipo,
        diaPago: contract.diaPago,
        clausulasAdicionales: contract.clausulasAdicionales,
        renovacionAutomatica: contract.renovacionAutomatica,
        unit: contract.unit,
        tenant: contract.tenant,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        diasHastaVencimiento: daysUntilExpiration,
      };
    });

    const response = NextResponse.json({
      data: contractsWithExpiration,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    logger.error('Error fetching contracts:', error);
    Sentry.captureException(error);
    return NextResponse.json({
      data: [],
      pagination: { page: 1, limit: 15, total: 0, totalPages: 0, hasMore: false },
      error: 'Error al obtener contratos',
    });
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
    const validationResult = contractCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating contract:', { errors });
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

    const contract = await prisma.contract.create({
      data: {
        unitId: validatedData.unitId,
        tenantId: validatedData.tenantId,
        fechaInicio: new Date(validatedData.fechaInicio),
        fechaFin: new Date(validatedData.fechaFin),
        rentaMensual: validatedData.rentaMensual,
        deposito: validatedData.deposito || 0,
        estado: validatedData.estado || 'activo',
        diaPago: validatedData.diaCobranza || 1,
        clausulasAdicionales: validatedData.clausulasEspeciales || '',
        renovacionAutomatica: validatedData.renovacionAutomatica || false,
      },
    });

    // Update unit status and tenant
    await prisma.unit.update({
      where: { id: validatedData.unitId },
      data: {
        estado: 'ocupada',
        tenantId: validatedData.tenantId,
      },
    });

    // Invalidar cachés relacionados
    await invalidateContractsCache(scope.activeCompanyId);
    await invalidateUnitsCache(scope.activeCompanyId);
    await invalidateDashboardCache(scope.activeCompanyId);

    logger.info('Contract created successfully', { contractId: contract.id });
    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating contract' });
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}

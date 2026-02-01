import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getSessionForRequest(req: NextRequest) {
  if (process.env.INTEGRATION_TESTS === 'true') {
    const companyId = req.headers.get('x-test-company-id');
    const userId = req.headers.get('x-test-user-id') || 'test-user';
    const role = req.headers.get('x-test-user-role') || 'administrador';

    if (companyId) {
      return {
        user: {
          id: userId,
          role,
          companyId,
        },
      } as any;
    }
  }

  return getServerSession(authOptions);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    const userRole = session.user?.role;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'soporte';

    // Si el usuario no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !companyId) {
      return NextResponse.json([]);
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    const filterCompanyId = searchParams.get('companyId');
    const estado = searchParams.get('estado');
    const tenantId = searchParams.get('tenantId');

    // Determinar el filtro de empresa
    const whereCompanyId = isSuperAdmin 
      ? (filterCompanyId || undefined) 
      : companyId;

    // Construir where clause
    const whereClause: any = whereCompanyId
      ? {
          unit: {
            building: {
              companyId: whereCompanyId,
            },
          },
        }
      : {};
    if (estado) {
      whereClause.estado = estado;
    }
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Si no hay paginación solicitada, usar cache si tiene companyId
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const hasFilters = Boolean(estado || tenantId);

    if (!usePagination && !hasFilters && whereCompanyId) {
      // Usar datos cacheados
      const contractsWithExpiration = await cachedContracts(whereCompanyId);
      return NextResponse.json(contractsWithExpiration);
    }

    // Si es super_admin sin filtro y sin paginación, retornar lista vacía
    if (isSuperAdmin && !whereCompanyId && !usePagination) {
      return NextResponse.json([]);
    }

    // Consulta directa (con o sin paginación)
    const contracts = await prisma.contract.findMany({
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
      skip: usePagination ? skip : undefined,
      take: usePagination ? limit : undefined,
    });

    const total = usePagination
      ? await prisma.contract.count({
          where: whereClause,
        })
      : contracts.length;

    // Calcular días hasta vencimiento y convertir valores Decimal
    const contractsWithExpiration = contracts.map(contract => {
      const daysUntilExpiration = Math.ceil(
        (new Date(contract.fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
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

    if (usePagination) {
      return NextResponse.json({
        data: contractsWithExpiration,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      });
    }

    return NextResponse.json(contractsWithExpiration);
  } catch (error) {
    logger.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionForRequest(req);
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
    const companyId = session.user?.companyId;

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
    if (companyId) {
      await invalidateContractsCache(companyId);
      await invalidateUnitsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    logger.info('Contract created successfully', { contractId: contract.id });
    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating contract' });
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}

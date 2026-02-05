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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    const filterCompanyId = searchParams.get('companyId');
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    const session = await getServerSession(authOptions);
    if (!session) {
      if (usePagination) {
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
          success: false,
          error: 'No autorizado',
        });
      }
      return NextResponse.json([]);
    }

    const companyId = session.user?.companyId;
    const userRole = session.user?.role;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'soporte';

    // Si el usuario no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !companyId) {
      return NextResponse.json([]);
    }

    // Determinar el filtro de empresa
    const whereCompanyId = isSuperAdmin 
      ? (filterCompanyId || undefined) 
      : companyId;

    // Construir where clause
    const whereClause = whereCompanyId ? {
      unit: {
        building: {
          companyId: whereCompanyId,
        },
      },
    } : {};

    // Si no hay paginación solicitada, usar cache si tiene companyId
    if (!usePagination && whereCompanyId) {
      // Usar datos cacheados
      const contractsWithExpiration = await cachedContracts(whereCompanyId);
      return NextResponse.json(contractsWithExpiration);
    }

    // Si es super_admin sin filtro y sin paginación, retornar lista vacía
    if (isSuperAdmin && !whereCompanyId && !usePagination) {
      return NextResponse.json([]);
    }

    // Paginación activada: consulta directa
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
  } catch (error) {
    logger.error('Error fetching contracts:', error);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (usePagination) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        success: false,
        error: 'Error al obtener contratos',
      });
    }
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const missingFields: string[] = [];
    const isBlank = (value: unknown) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '');

    const normalizeNumber = (value: unknown, field: string, fallback: number) => {
      if (isBlank(value)) {
        missingFields.push(field);
        return fallback;
      }
      const num = Number(value);
      if (Number.isNaN(num)) {
        missingFields.push(field);
        return fallback;
      }
      return num;
    };

    const normalizeDate = (value: unknown, field: string, fallback: Date) => {
      if (isBlank(value)) {
        missingFields.push(field);
        return fallback.toISOString();
      }
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) {
        missingFields.push(field);
        return fallback.toISOString();
      }
      return date.toISOString();
    };

    const now = new Date();
    const defaultStart = new Date(now);
    const defaultEnd = new Date(now);
    defaultEnd.setMonth(defaultEnd.getMonth() + 1);

    const dataToValidate = {
      ...body,
      fechaInicio: normalizeDate(body.fechaInicio, 'fechaInicio', defaultStart),
      fechaFin: normalizeDate(body.fechaFin, 'fechaFin', defaultEnd),
      rentaMensual: normalizeNumber(body.rentaMensual, 'rentaMensual', 0),
      deposito: normalizeNumber(body.deposito, 'deposito', 0),
    };

    const startDate = new Date(dataToValidate.fechaInicio);
    const endDate = new Date(dataToValidate.fechaFin);
    if (endDate <= startDate) {
      missingFields.push('fechaFin');
      const fallbackEnd = new Date(startDate);
      fallbackEnd.setMonth(fallbackEnd.getMonth() + 1);
      dataToValidate.fechaFin = fallbackEnd.toISOString();
    }
    
    // Validación con Zod
    const uniqueMissingFields = Array.from(new Set(missingFields));
    const validationResult = contractCreateSchema.safeParse(dataToValidate);
    
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
    return NextResponse.json({ ...contract, missingFields: uniqueMissingFields }, { status: 201 });
  } catch (error: any) {
    logError(error, { context: 'Error creating contract' });
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}

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
  invalidateDashboardCache,
} from '@/lib/api-cache-helpers';

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

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    // Si no hay paginación solicitada, usar cache
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (!usePagination) {
      // Usar datos cacheados
      const contractsWithExpiration = await cachedContracts(companyId);
      return NextResponse.json(contractsWithExpiration);
    }

    // Paginación activada: consulta directa
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: {
          unit: {
            building: {
              companyId,
            },
          },
        },
        include: {
          unit: {
            include: {
              building: true,
            },
          },
          tenant: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({
        where: {
          unit: {
            building: {
              companyId,
            },
          },
        },
      }),
    ]);

    // Calcular días hasta vencimiento para cada contrato
    const contractsWithExpiration = contracts.map((contract) => {
      const daysUntilExpiration = Math.ceil(
        (new Date(contract.fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...contract,
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
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
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
    const validationResult = contractCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating contract:', { errors });
      return NextResponse.json({ error: 'Datos inv\u00e1lidos', details: errors }, { status: 400 });
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

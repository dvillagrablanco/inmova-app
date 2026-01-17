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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    const userRole = session.user?.role;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'soporte';

    // Logging para debugging
    logger.info('Contracts API request', { 
      userId: session.user?.id,
      companyId, 
      role: userRole,
      isSuperAdmin 
    });

    // Si el usuario no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !companyId) {
      logger.warn('Usuario sin companyId intentando acceder a contratos', {
        userId: session.user?.id,
        email: session.user?.email,
      });
      return NextResponse.json([]);
    }

    // Obtener parámetros de paginación y filtro
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    const filterCompanyId = searchParams.get('companyId');
    const tipoFilter = searchParams.get('tipo');

    // Determinar el filtro de empresa
    const whereCompanyId = isSuperAdmin 
      ? (filterCompanyId || undefined) 
      : companyId;

    // Construir where clause con manejo seguro
    let whereClause: any = {};
    
    if (whereCompanyId) {
      whereClause = {
        unit: {
          building: {
            companyId: whereCompanyId,
          },
        },
      };
    }

    // Añadir filtro por tipo si se especifica
    if (tipoFilter) {
      whereClause.tipo = tipoFilter;
    }

    // Si no hay paginación solicitada, usar cache si tiene companyId
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (!usePagination && whereCompanyId) {
      try {
        // Usar datos cacheados con manejo de errores
        const contractsWithExpiration = await cachedContracts(whereCompanyId);
        
        // Filtrar por tipo si es necesario
        if (tipoFilter && Array.isArray(contractsWithExpiration)) {
          const filtered = contractsWithExpiration.filter(
            (c: any) => c.tipo?.toLowerCase() === tipoFilter.toLowerCase()
          );
          return NextResponse.json(filtered);
        }
        
        return NextResponse.json(contractsWithExpiration);
      } catch (cacheError) {
        // Si falla el cache, continuar con consulta directa
        logger.warn('Cache error, falling back to direct query', { error: cacheError });
      }
    }

    // Si es super_admin sin filtro y sin paginación, retornar lista vacía
    if (isSuperAdmin && !whereCompanyId && !usePagination) {
      return NextResponse.json([]);
    }

    // Consulta directa con manejo de errores mejorado
    try {
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

      // Calcular días hasta vencimiento y convertir valores Decimal con manejo seguro
      const contractsWithExpiration = contracts.map(contract => {
        const fechaFin = contract.fechaFin ? new Date(contract.fechaFin) : new Date();
        const daysUntilExpiration = Math.ceil(
          (fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: contract.id,
          unitId: contract.unitId,
          tenantId: contract.tenantId,
          fechaInicio: contract.fechaInicio,
          fechaFin: contract.fechaFin,
          rentaMensual: Number(contract.rentaMensual || 0),
          deposito: Number(contract.deposito || 0),
          estado: contract.estado || 'activo',
          tipo: contract.tipo || 'alquiler',
          diaPago: contract.diaPago || 1,
          clausulasAdicionales: contract.clausulasAdicionales || '',
          renovacionAutomatica: contract.renovacionAutomatica || false,
          unit: contract.unit ? {
            id: contract.unit.id,
            numero: contract.unit.numero || 'Sin número',
            tipo: contract.unit.tipo,
            building: contract.unit.building ? {
              id: contract.unit.building.id,
              nombre: contract.unit.building.nombre || 'Sin nombre',
              direccion: contract.unit.building.direccion,
              company: contract.unit.building.company,
            } : null,
          } : null,
          tenant: contract.tenant ? {
            id: contract.tenant.id,
            nombreCompleto: contract.tenant.nombreCompleto || 'Sin nombre',
            email: contract.tenant.email,
            telefono: contract.tenant.telefono,
          } : null,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
          diasHastaVencimiento: daysUntilExpiration,
        };
      });

      // Si se solicita paginación, devolver formato con paginación
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

      // Sin paginación, devolver array simple
      return NextResponse.json(contractsWithExpiration);
    } catch (dbError) {
      logger.error('Database error fetching contracts:', dbError);
      throw dbError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error fetching contracts:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      { 
        error: 'Error al obtener contratos', 
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      }, 
      { status: 500 }
    );
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

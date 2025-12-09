/**
 * Optimizaciones de base de datos
 * - Queries con include optimizado
 * - Paginación eficiente
 * - Agregaciones optimizadas
 */

import { Prisma } from '@prisma/client';
import { prisma } from './db';

/**
 * Interfaz de paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Helper para paginación offset-based
 */
export async function paginateQuery<T>(
  model: any,
  where: any,
  options: PaginationOptions & { include?: any; orderBy?: any; select?: any }
): Promise<PaginatedResult<T>> {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 25, 100); // Max 100 items
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      include: options.include,
      orderBy: options.orderBy,
      select: options.select,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Helper para paginación cursor-based (más eficiente para datasets grandes)
 */
export async function paginateQueryCursor<T>(
  model: any,
  where: any,
  options: PaginationOptions & {
    include?: any;
    orderBy?: any;
    select?: any;
    cursorField?: string;
  }
): Promise<{
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  const limit = Math.min(options.limit || 25, 100);
  const cursorField = options.cursorField || 'id';

  const query: any = {
    where,
    take: limit + 1, // +1 para saber si hay más
    include: options.include,
    orderBy: options.orderBy,
    select: options.select,
  };

  if (options.cursor) {
    query.cursor = { [cursorField]: options.cursor };
    query.skip = 1; // Skip el cursor actual
  }

  const data = await model.findMany(query);

  const hasMore = data.length > limit;
  if (hasMore) {
    data.pop(); // Remover el item extra
  }

  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1][cursorField] : undefined;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Query optimizada para dashboard stats
 * Usa agregaciones eficientes y queries paralelas
 */
export async function getDashboardStatsOptimized(companyId: string) {
  const [stats, recentPayments, maintenanceStats] = await Promise.all([
    // Stats básicos en paralelo
    prisma.$transaction([
      prisma.building.count({ where: { companyId } }),
      prisma.unit.count({ where: { building: { companyId } } }),
      prisma.tenant.count({ where: { companyId } }),
      prisma.contract.count({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
        },
      }),
    ]),

    // Recent payments
    prisma.payment.findMany({
      where: {
        contract: {
          unit: { building: { companyId } },
        },
      },
      take: 10,
      orderBy: { fechaVencimiento: 'desc' },
      select: {
        id: true,
        monto: true,
        estado: true,
        fechaVencimiento: true,
        contract: {
          select: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
          },
        },
      },
    }),

    // Maintenance stats
    prisma.maintenanceRequest.groupBy({
      by: ['estado'],
      where: {
        unit: { building: { companyId } },
      },
      _count: true,
    }),
  ]);

  const [totalBuildings, totalUnits, totalTenants, activeContracts] = stats;

  return {
    totalBuildings,
    totalUnits,
    totalTenants,
    activeContracts,
    occupancyRate: totalUnits > 0 ? (activeContracts / totalUnits) * 100 : 0,
    recentPayments,
    maintenanceStats: maintenanceStats.reduce(
      (acc, stat) => {
        acc[stat.estado] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Query optimizada para buildings con sus unidades y stats
 */
export async function getBuildingsWithStats(companyId: string, options?: PaginationOptions) {
  return paginateQuery(
    prisma.building,
    { companyId },
    {
      ...options,
      include: {
        _count: {
          select: {
            units: true,
          },
        },
        units: {
          take: 1, // Solo necesitamos saber si tiene unidades
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }
  );
}

/**
 * Query optimizada para contracts con datos relacionados
 */
export async function getContractsWithDetails(companyId: string, options?: PaginationOptions) {
  return paginateQuery(
    prisma.contract,
    {
      unit: { building: { companyId } },
    },
    {
      ...options,
      include: {
        tenant: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        unit: {
          select: {
            id: true,
            nombre: true,
            building: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }
  );
}

/**
 * Agregación optimizada de pagos
 */
export async function getPaymentStats(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const [totalAmount, statsByStatus, monthlyTrend] = await Promise.all([
    // Total amount
    prisma.payment.aggregate({
      where: {
        contract: {
          unit: { building: { companyId } },
        },
        fechaVencimiento: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        monto: true,
      },
      _count: true,
    }),

    // Stats by status
    prisma.payment.groupBy({
      by: ['estado'],
      where: {
        contract: {
          unit: { building: { companyId } },
        },
        fechaVencimiento: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        monto: true,
      },
      _count: true,
    }),

    // Monthly trend
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "fechaVencimiento") as month,
        SUM(monto) as total,
        COUNT(*) as count
      FROM "Payment"
      WHERE "contractId" IN (
        SELECT c.id FROM "Contract" c
        INNER JOIN "Unit" u ON c."unitId" = u.id
        INNER JOIN "Building" b ON u."buildingId" = b.id
        WHERE b."companyId" = ${companyId}
      )
      AND "fechaVencimiento" BETWEEN ${startDate} AND ${endDate}
      GROUP BY month
      ORDER BY month DESC
    `,
  ]);

  return {
    total: {
      amount: totalAmount._sum.monto || 0,
      count: totalAmount._count,
    },
    byStatus: statsByStatus.map(stat => ({
      estado: stat.estado,
      amount: stat._sum.monto || 0,
      count: stat._count,
    })),
    monthlyTrend,
  };
}

/**
 * Batch update optimizado
 */
export async function batchUpdate<T>(
  model: any,
  updates: Array<{ where: any; data: any }>
): Promise<T[]> {
  return prisma.$transaction(
    updates.map(({ where, data }) => model.update({ where, data }))
  );
}

/**
 * Upsert optimizado en batch
 */
export async function batchUpsert<T>(
  model: any,
  items: Array<{ where: any; create: any; update: any }>
): Promise<T[]> {
  return prisma.$transaction(
    items.map(({ where, create, update }) => model.upsert({ where, create, update }))
  );
}

/**
 * Soft delete optimizado
 */
export async function softDelete(
  model: any,
  where: any
): Promise<number> {
  const result = await model.updateMany({
    where,
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Full-text search optimizado (PostgreSQL)
 */
export async function fullTextSearch(
  table: string,
  searchFields: string[],
  searchTerm: string,
  where?: any,
  limit: number = 25
) {
  const searchQuery = searchFields
    .map(field => `${field}::text ILIKE $1`)
    .join(' OR ');

  const query = `
    SELECT * FROM "${table}"
    WHERE (${searchQuery})
    ${where ? `AND ${where}` : ''}
    LIMIT $2
  `;

  return prisma.$queryRawUnsafe(query, `%${searchTerm}%`, limit);
}

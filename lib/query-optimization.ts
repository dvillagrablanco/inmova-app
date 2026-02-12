/**
 * Helpers para optimización de queries con Prisma
 * Implementa patrones de select específicos en lugar de fetch completo
 */

import { prisma } from './db';
import type { Prisma } from '@/types/prisma-types';

/**
 * Selects optimizados predefinidos para modelos principales
 */

// Building - Select mínimo para listados
export const buildingSelectMinimal = {
  id: true,
  nombre: true,
  direccion: true,
  tipo: true,
  numeroUnidades: true,
  imagenes: true,
} satisfies Prisma.BuildingSelect;

// Building - Select para dashboard
export const buildingSelectDashboard = {
  id: true,
  nombre: true,
  direccion: true,
  tipo: true,
  numeroUnidades: true,
  imagenes: true,
  gastosComunidad: true,
  ibiAnual: true,
  createdAt: true,
  units: {
    select: {
      id: true,
      estado: true,
      rentaMensual: true,
    },
  },
} satisfies Prisma.BuildingSelect;

// Unit - Select mínimo
export const unitSelectMinimal = {
  id: true,
  numero: true,
  tipo: true,
  estado: true,
  rentaMensual: true,
  superficie: true,
  habitaciones: true,
  banos: true,
} satisfies Prisma.UnitSelect;

// Unit - Select para listado con relaciones
export const unitSelectWithBuilding = {
  ...unitSelectMinimal,
  building: {
    select: {
      id: true,
      nombre: true,
      direccion: true,
    },
  },
} satisfies Prisma.UnitSelect;

// Contract - Select mínimo
export const contractSelectMinimal = {
  id: true,
  fechaInicio: true,
  fechaFin: true,
  rentaMensual: true,
  estado: true,
} satisfies Prisma.ContractSelect;

// Contract - Select con relaciones
export const contractSelectWithRelations = {
  ...contractSelectMinimal,
  unit: {
    select: {
      id: true,
      numero: true,
      building: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  },
  tenant: {
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
      telefono: true,
    },
  },
} satisfies Prisma.ContractSelect;

// Payment - Select mínimo
export const paymentSelectMinimal = {
  id: true,
  periodo: true,
  monto: true,
  fechaVencimiento: true,
  fechaPago: true,
  estado: true,
} satisfies Prisma.PaymentSelect;

// Payment - Select con relaciones
export const paymentSelectWithRelations = {
  ...paymentSelectMinimal,
  contract: {
    select: {
      id: true,
      tenant: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
        },
      },
      unit: {
        select: {
          id: true,
          numero: true,
          building: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

// Tenant - Select mínimo
export const tenantSelectMinimal = {
  id: true,
  nombreCompleto: true,
  email: true,
  telefono: true,
} satisfies Prisma.TenantSelect;

// Tenant - Select para perfil
export const tenantSelectProfile = {
  id: true,
  nombreCompleto: true,
  email: true,
  telefono: true,
  dni: true,
  fechaNacimiento: true,
  direccionActual: true,
  situacionLaboral: true,
  scoring: true,
  nivelRiesgo: true,
  createdAt: true,
} satisfies Prisma.TenantSelect;

/**
 * Queries optimizadas predefinidas
 */

/**
 * Obtiene edificios con métricas básicas
 * Ütil para listados y dashboards
 */
export async function getBuildingsWithMetrics(companyId: string) {
  return prisma.building.findMany({
    where: { companyId },
    select: buildingSelectDashboard,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene unidades disponibles con información mínima
 * Optimizado para búsquedas rápidas
 */
export async function getAvailableUnits(buildingId?: string) {
  return prisma.unit.findMany({
    where: {
      estado: 'disponible',
      ...(buildingId && { buildingId }),
    },
    select: unitSelectWithBuilding,
    orderBy: { rentaMensual: 'asc' },
  });
}

/**
 * Obtiene contratos activos con información necesaria
 * Sin datos excesivos de relaciones
 */
export async function getActiveContracts(companyId: string) {
  return prisma.contract.findMany({
    where: {
      unit: {
        building: { companyId },
      },
      estado: 'activo',
    },
    select: contractSelectWithRelations,
    orderBy: { fechaFin: 'asc' },
  });
}

/**
 * Obtiene pagos pendientes optimizado
 * Solo campos necesarios para gestión
 */
export async function getPendingPayments(companyId: string) {
  return prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          building: { companyId },
        },
      },
      estado: 'pendiente',
    },
    select: paymentSelectWithRelations,
    orderBy: { fechaVencimiento: 'asc' },
    take: 100, // Limitar para performance
  });
}

/**
 * Obtiene inquilinos con scoring
 * Solo datos esenciales
 */
export async function getTenantsWithScoring(companyId: string) {
  return prisma.tenant.findMany({
    where: { companyId },
    select: {
      ...tenantSelectProfile,
      contracts: {
        where: { estado: 'activo' },
        select: contractSelectMinimal,
        take: 1,
      },
    },
    orderBy: { scoring: 'desc' },
  });
}

/**
 * Obtiene contratos próximos a vencer (30 días)
 * Optimizado para alertas
 */
export async function getExpiringContracts(companyId: string, daysAhead: number = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return prisma.contract.findMany({
    where: {
      unit: {
        building: { companyId },
      },
      estado: 'activo',
      fechaFin: {
        gte: today,
        lte: futureDate,
      },
    },
    select: {
      id: true,
      fechaFin: true,
      rentaMensual: true,
      unit: {
        select: {
          numero: true,
          building: {
            select: {
              nombre: true,
            },
          },
        },
      },
      tenant: {
        select: {
          nombreCompleto: true,
          email: true,
          telefono: true,
        },
      },
    },
    orderBy: { fechaFin: 'asc' },
  });
}

/**
 * Obtiene estadísticas de ocupación por edificio
 * Usando agregaciones eficientes
 */
export async function getBuildingOccupancyStats(buildingId: string) {
  const [total, occupied, available, maintenance] = await Promise.all([
    prisma.unit.count({ where: { buildingId } }),
    prisma.unit.count({ where: { buildingId, estado: 'ocupada' } }),
    prisma.unit.count({ where: { buildingId, estado: 'disponible' } }),
    prisma.unit.count({ where: { buildingId, estado: 'en_mantenimiento' } }),
  ]);

  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

  return {
    total,
    occupied,
    available,
    maintenance,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  };
}

/**
 * Obtiene resumen financiero del mes
 * Solo agregaciones, sin fetch de datos completos
 */
export async function getMonthlyFinancialSummary(companyId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const [income, expenses, pendingPayments] = await Promise.all([
    // Ingresos del mes
    prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: { companyId },
          },
        },
        estado: 'pagado',
        fechaPago: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { monto: true },
      _count: true,
    }),
    
    // Gastos del mes
    prisma.expense.aggregate({
      where: {
        building: { companyId },
        fecha: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { monto: true },
      _count: true,
    }),
    
    // Pagos pendientes
    prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: { companyId },
          },
        },
        estado: 'pendiente',
        fechaVencimiento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { monto: true },
      _count: true,
    }),
  ]);

  return {
    period: {
      start: startOfMonth,
      end: endOfMonth,
    },
    income: {
      total: income._sum.monto || 0,
      count: income._count,
    },
    expenses: {
      total: expenses._sum.monto || 0,
      count: expenses._count,
    },
    pending: {
      total: pendingPayments._sum.monto || 0,
      count: pendingPayments._count,
    },
    netIncome: (income._sum.monto || 0) - (expenses._sum.monto || 0),
  };
}

/**
 * Helper para paginación eficiente (cursor-based)
 */
export interface PaginationOptions {
  cursor?: string;
  take?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export async function paginatedQuery<T>(
  query: (options: { cursor?: any; take: number }) => Promise<T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const take = options.take || 20;
  
  const data = await query({
    cursor: options.cursor ? { id: options.cursor } : undefined,
    take: take + 1, // Fetch one extra to check if there's more
  });

  const hasMore = data.length > take;
  const paginatedData = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore && paginatedData.length > 0 
    ? (paginatedData[paginatedData.length - 1] as any).id 
    : undefined;

  return {
    data: paginatedData,
    nextCursor,
    hasMore,
  };
}

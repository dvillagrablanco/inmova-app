/**
 * Helpers específicos de caché para cada endpoint de API
 * Cada helper define su propia lógica de caché, TTL e invalidación
 */

import { prisma } from './db';
import { withCache, cacheService } from './redis-cache-service';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// TTLs específicos por tipo de dato (en milisegundos)
const TTL_DASHBOARD = 5 * 60 * 1000; // 5 minutos
const TTL_BUILDINGS = 10 * 60 * 1000; // 10 minutos
const TTL_UNITS = 10 * 60 * 1000; // 10 minutos
const TTL_PAYMENTS = 3 * 60 * 1000; // 3 minutos (más dinámico)
const TTL_CONTRACTS = 10 * 60 * 1000; // 10 minutos
const TTL_TENANTS = 10 * 60 * 1000; // 10 minutos
const TTL_EXPENSES = 5 * 60 * 1000; // 5 minutos
const TTL_MAINTENANCE = 5 * 60 * 1000; // 5 minutos
const TTL_ANALYTICS = 15 * 60 * 1000; // 15 minutos (menos crítico)

/**
 * DASHBOARD STATS
 * Cachea las estadísticas del dashboard principal
 */
export async function cachedDashboardStats(companyId: string) {
  const cacheKey = `dashboard:stats:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      // Consultas originales del dashboard
      const [totalBuildings, totalUnits, totalTenants, activeContracts] = await Promise.all([
        prisma.building.count({ where: { companyId } }),
        prisma.unit.count({
          where: { building: { companyId } },
        }),
        prisma.tenant.count({ where: { companyId } }),
        prisma.contract.count({
          where: {
            unit: { building: { companyId } },
            estado: 'activo',
          },
        }),
      ]);

      // Cálculo de ocupación
      const occupancyRate = totalUnits > 0 ? (activeContracts / totalUnits) * 100 : 0;

      // Ingresos del mes actual
      const currentMonth = new Date();
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const paymentsCurrentMonth = await prisma.payment.aggregate({
        where: {
          contract: {
            unit: { building: { companyId } },
          },
          fechaVencimiento: {
            gte: startDate,
            lte: endDate,
          },
          estado: 'pagado',
        },
        _sum: { monto: true },
      });

      const monthlyIncome = paymentsCurrentMonth._sum.monto || 0;

      // Pagos pendientes
      const pendingPayments = await prisma.payment.count({
        where: {
          contract: {
            unit: { building: { companyId } },
          },
          estado: 'pendiente',
        },
      });

      // Solicitudes de mantenimiento pendientes
      const pendingMaintenance = await prisma.maintenanceRequest.count({
        where: {
          unit: { building: { companyId } },
          estado: 'pendiente',
        },
      });

      // Ingresos históricos (últimos 6 meses)
      const monthlyIncome6: Array<{ mes: string; ingresos: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(currentMonth, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthPayments = await prisma.payment.aggregate({
          where: {
            contract: {
              unit: { building: { companyId } },
            },
            fechaVencimiento: {
              gte: monthStart,
              lte: monthEnd,
            },
            estado: 'pagado',
          },
          _sum: { monto: true },
        });

        monthlyIncome6.push({
          mes: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
          ingresos: Number(monthPayments._sum.monto) || 0,
        });
      }

      return {
        kpis: {
          numeroPropiedades: totalBuildings,
          numeroUnidades: totalUnits,
          numeroInquilinos: totalTenants,
          tasaOcupacion: Number(occupancyRate.toFixed(2)),
          ingresosMensuales: Number(monthlyIncome),
          pagosPendientes: pendingPayments,
          mantenimientosPendientes: pendingMaintenance,
        },
        monthlyIncome: monthlyIncome6,
      };
    },
    TTL_DASHBOARD
  );
}

/**
 * BUILDINGS
 * Cachea la lista de edificios con métricas calculadas
 */
export async function cachedBuildings(companyId: string) {
  const cacheKey = `buildings:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
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

      // Calcular métricas para cada edificio
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

      return buildingsWithMetrics;
    },
    TTL_BUILDINGS
  );
}

/**
 * UNITS
 * Cachea la lista de unidades
 */
export async function cachedUnits(companyId: string) {
  const cacheKey = `units:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      return prisma.unit.findMany({
        where: { building: { companyId } },
        include: {
          building: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
            take: 1,
            include: {
              tenant: {
                select: {
                  id: true,
                  nombreCompleto: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    TTL_UNITS
  );
}

/**
 * PAYMENTS
 * Cachea la lista de pagos
 */
export async function cachedPayments(companyId: string) {
  const cacheKey = `payments:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      return prisma.payment.findMany({
        where: {
          contract: {
            unit: { building: { companyId } },
          },
        },
        include: {
          contract: {
            include: {
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
        },
        orderBy: { fechaVencimiento: 'desc' },
        take: 100, // Limitar a los 100 más recientes
      });
    },
    TTL_PAYMENTS
  );
}

/**
 * CONTRACTS
 * Cachea la lista de contratos con días hasta vencimiento
 */
export async function cachedContracts(companyId: string) {
  const cacheKey = `contracts:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      const contracts = await prisma.contract.findMany({
        where: {
          unit: { building: { companyId } },
        },
        include: {
          unit: {
            include: {
              building: true,
            },
          },
          tenant: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Agregar días hasta el vencimiento
      const contractsWithExpiration = contracts.map((contract) => {
        const today = new Date();
        const fechaFin = new Date(contract.fechaFin);
        const diasHastaVencimiento = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...contract,
          diasHastaVencimiento,
        };
      });

      return contractsWithExpiration;
    },
    TTL_CONTRACTS
  );
}

/**
 * TENANTS
 * Cachea la lista de inquilinos
 */
export async function cachedTenants(companyId: string) {
  const cacheKey = `tenants:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      return prisma.tenant.findMany({
        where: { companyId },
        include: {
          contracts: {
            where: { estado: 'activo' },
            take: 1,
            include: {
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
            },
          },
          _count: {
            select: {
              contracts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    TTL_TENANTS
  );
}

/**
 * EXPENSES
 * Cachea la lista de gastos
 */
export async function cachedExpenses(companyId: string) {
  const cacheKey = `expenses:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      return prisma.expense.findMany({
        where: {
          building: { companyId },
        },
        include: {
          building: {
            select: {
              id: true,
              nombre: true,
            },
          },
          unit: {
            select: {
              id: true,
              numero: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
        take: 100, // Limitar a los 100 más recientes
      });
    },
    TTL_EXPENSES
  );
}

/**
 * MAINTENANCE
 * Cachea la lista de solicitudes de mantenimiento
 */
export async function cachedMaintenance(companyId: string) {
  const cacheKey = `maintenance:list:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      return prisma.maintenanceRequest.findMany({
        where: {
          unit: { building: { companyId } },
        },
        include: {
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
          provider: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: { fechaSolicitud: 'desc' },
        take: 100, // Limitar a los 100 más recientes
      });
    },
    TTL_MAINTENANCE
  );
}

/**
 * ANALYTICS
 * Cachea datos de analytics (genérico)
 */
export async function cachedAnalytics(companyId: string, type: string) {
  const cacheKey = `analytics:${type}:${companyId}`;

  return withCache(
    cacheKey,
    async () => {
      // Aquí puedes implementar diferentes tipos de analytics
      // Por ahora devolvemos un objeto básico
      return {
        type,
        companyId,
        data: [],
        timestamp: new Date(),
      };
    },
    TTL_ANALYTICS
  );
}

/**
 * CACHE INVALIDATION HELPERS
 * Funciones para invalidar caché cuando se modifican datos
 * NOTA: Estas funciones son asíncronas al usar Redis
 */

export async function invalidateDashboardCache(companyId: string): Promise<void> {
  await cacheService.delete(`dashboard:stats:${companyId}`);
}

export async function invalidateBuildingsCache(companyId: string): Promise<void> {
  await cacheService.delete(`buildings:list:${companyId}`);
}

export async function invalidateUnitsCache(companyId: string): Promise<void> {
  await cacheService.delete(`units:list:${companyId}`);
}

export async function invalidatePaymentsCache(companyId: string): Promise<void> {
  await cacheService.delete(`payments:list:${companyId}`);
}

export async function invalidateContractsCache(companyId: string): Promise<void> {
  await cacheService.delete(`contracts:list:${companyId}`);
}

export async function invalidateTenantsCache(companyId: string): Promise<void> {
  await cacheService.delete(`tenants:list:${companyId}`);
}

export async function invalidateExpensesCache(companyId: string): Promise<void> {
  await cacheService.delete(`expenses:list:${companyId}`);
}

export async function invalidateMaintenanceCache(companyId: string): Promise<void> {
  await cacheService.delete(`maintenance:list:${companyId}`);
}

export async function invalidateAnalyticsCache(companyId: string, type?: string): Promise<void> {
  if (type) {
    await cacheService.delete(`analytics:${type}:${companyId}`);
  } else {
    await cacheService.invalidateByPattern(`analytics:`);
  }
}

/**
 * Invalida todo el caché de una empresa
 */
export async function invalidateCompanyCache(companyId: string): Promise<void> {
  await cacheService.invalidateByPattern(companyId);
}

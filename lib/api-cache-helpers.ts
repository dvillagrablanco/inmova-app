/**
 * Helpers específicos de caché para cada endpoint de API
 * Cada helper define su propia lógica de caché, TTL e invalidación
 */

import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================
// Inline cache (eliminado redis-cache-service.ts en cleanup)
// Provee withCache y cacheService como fallback en memoria
// ============================================================
const memoryCache = new Map<string, { data: unknown; expiry: number }>();

async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  const data = await fetcher();
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
  return data;
}

const cacheService = {
  invalidate: (pattern: string) => {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  },
  get: async (key: string) => {
    const cached = memoryCache.get(key);
    return cached && cached.expiry > Date.now() ? cached.data : null;
  },
  set: async (key: string, data: unknown, ttlMs: number) => {
    memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
  },
};

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
      const prisma = await getPrisma();
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
      const prisma = await getPrisma();
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
          .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);

        return {
          id: building.id,
          nombre: building.nombre,
          direccion: building.direccion,
          tipo: building.tipo,
          anoConstructor: building.anoConstructor,
          numeroUnidades: building.numeroUnidades,
          companyId: building.companyId,
          createdAt: building.createdAt,
          updatedAt: building.updatedAt,
          metrics: {
            totalUnits,
            occupiedUnits,
            ocupacionPct: Number((Math.round(ocupacionPct * 10) / 10).toFixed(1)),
            ingresosMensuales: Number((Math.round(ingresosMensuales * 100) / 100).toFixed(2)),
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
      const prisma = await getPrisma();
      const units = await prisma.unit.findMany({
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

      // Transformar la estructura para que sea compatible con el frontend
      return units.map((unit) => ({
        id: unit.id,
        numero: unit.numero,
        tipo: unit.tipo,
        estado: unit.estado,
        planta: unit.planta,
        superficie: Number(unit.superficie || 0),
        habitaciones: unit.habitaciones,
        banos: unit.banos,
        rentaMensual: Number(unit.rentaMensual || 0),
        building: unit.building,
        tenant: unit.contracts?.[0]?.tenant || null,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      }));
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
      const prisma = await getPrisma();
      const payments = await prisma.payment.findMany({
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

      // Convertir valores Decimal a números
      return payments.map(payment => ({
        id: payment.id,
        contractId: payment.contractId,
        periodo: payment.periodo,
        monto: Number(payment.monto || 0),
        fechaVencimiento: payment.fechaVencimiento,
        fechaPago: payment.fechaPago,
        estado: payment.estado,
        metodoPago: payment.metodoPago,
        notasAdicionales: payment.notasAdicionales,
        contract: payment.contract,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }));
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
      const prisma = await getPrisma();
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

      // Agregar días hasta el vencimiento y convertir valores Decimal
      const contractsWithExpiration = contracts.map((contract) => {
        const today = new Date();
        const fechaFin = new Date(contract.fechaFin);
        const diasHastaVencimiento = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
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
          payments: contract.payments.map(p => ({
            ...p,
            monto: Number(p.monto || 0),
          })),
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
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
      const prisma = await getPrisma();
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
      const prisma = await getPrisma();
      const expenses = await prisma.expense.findMany({
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

      // Convertir valores Decimal a números
      return expenses.map(expense => ({
        ...expense,
        monto: Number(expense.monto || 0),
      }));
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
      const prisma = await getPrisma();
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
      const prisma = await getPrisma();
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

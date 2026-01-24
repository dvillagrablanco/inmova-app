/**
 * Servicio de Analytics Avanzado
 * 
 * Recopila y analiza métricas de uso, performance y costos de IA.
 * 
 * @module AnalyticsService
 */

import { prisma } from './db';
import cache from './cache-service';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface UsageMetrics {
  period: 'today' | 'week' | 'month' | 'year';
  api: {
    totalRequests: number;
    requestsByEndpoint: { [key: string]: number };
    avgResponseTime: number;
    errorRate: number;
  };
  features: {
    valuationsCount: number;
    matchesCount: number;
    incidentsCount: number;
    marketingPostsCount: number;
  };
  users: {
    activeUsers: number;
    newUsers: number;
    dailyActiveUsers: number;
  };
  properties: {
    totalProperties: number;
    newProperties: number;
    rentedProperties: number;
    availableProperties: number;
  };
}

export interface AIMetrics {
  period: 'today' | 'week' | 'month' | 'year';
  usage: {
    totalRequests: number;
    requestsByFeature: {
      valuations: number;
      matching: number;
      incidents: number;
      marketing: number;
    };
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
  costs: {
    total: number;
    byFeature: {
      valuations: number;
      matching: number;
      incidents: number;
      marketing: number;
    };
    avgCostPerRequest: number;
  };
  performance: {
    avgLatency: number;
    successRate: number;
    errorRate: number;
  };
}

export interface PerformanceMetrics {
  period: 'today' | 'week' | 'month';
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
    avgHitLatency: number;
    avgMissLatency: number;
  };
  database: {
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  api: {
    p50: number; // Percentil 50 (mediana)
    p95: number; // Percentil 95
    p99: number; // Percentil 99
    avgResponseTime: number;
  };
}

// ============================================================================
// TRACKING DE MÉTRICAS
// ============================================================================

/**
 * Registra una request de API
 */
export async function trackAPIRequest(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number
): Promise<void> {
  try {
    const date = new Date();
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Incrementar contadores en cache
    await Promise.all([
      cache.increment({ type: 'api_request', endpoint, date: dateKey }),
      cache.increment({ type: 'api_total', date: dateKey }),
      statusCode >= 400 && cache.increment({ type: 'api_error', date: dateKey }),
    ]);

    // Guardar response time
    await cache.set(
      { type: 'api_response_time', endpoint, date: dateKey },
      responseTime,
      { ttl: 86400 } // 24 horas
    );

  } catch (error) {
    // No fallar si analytics falla
    logger.warn('Failed to track API request:', error);
  }
}

/**
 * Registra uso de IA
 */
export async function trackAIUsage(
  feature: 'valuations' | 'matching' | 'incidents' | 'marketing',
  inputTokens: number,
  outputTokens: number,
  cost: number,
  latency: number,
  success: boolean
): Promise<void> {
  try {
    const date = new Date();
    const dateKey = date.toISOString().split('T')[0];

    // Incrementar contadores
    await Promise.all([
      cache.increment({ type: 'ai_request', feature, date: dateKey }),
      !success && cache.increment({ type: 'ai_error', feature, date: dateKey }),
    ]);

    // Acumular tokens y costos
    const tokensKey = { type: 'ai_tokens', feature, date: dateKey };
    const currentTokens = (await cache.get<number>(tokensKey)) || 0;
    await cache.set(tokensKey, currentTokens + inputTokens + outputTokens, { ttl: 86400 });

    const costKey = { type: 'ai_cost', feature, date: dateKey };
    const currentCost = (await cache.get<number>(costKey)) || 0;
    await cache.set(costKey, currentCost + cost, { ttl: 86400 });

    const latencyTotalKey = { type: 'ai_latency_total', date: dateKey };
    const latencyCountKey = { type: 'ai_latency_count', date: dateKey };
    const currentLatencyTotal = (await cache.get<number>(latencyTotalKey)) || 0;
    const currentLatencyCount = (await cache.get<number>(latencyCountKey)) || 0;
    await Promise.all([
      cache.set(latencyTotalKey, currentLatencyTotal + latency, { ttl: 86400 }),
      cache.set(latencyCountKey, currentLatencyCount + 1, { ttl: 86400 }),
    ]);

  } catch (error) {
    logger.warn('Failed to track AI usage:', error);
  }
}

/**
 * Registra cache hit/miss
 */
export async function trackCacheAccess(
  hit: boolean,
  latency: number
): Promise<void> {
  try {
    const date = new Date();
    const dateKey = date.toISOString().split('T')[0];

    if (hit) {
      await cache.increment({ type: 'cache_hit', date: dateKey });
      const totalKey = { type: 'cache_hit_latency_total', date: dateKey };
      const countKey = { type: 'cache_hit_latency_count', date: dateKey };
      const currentTotal = (await cache.get<number>(totalKey)) || 0;
      const currentCount = (await cache.get<number>(countKey)) || 0;
      await Promise.all([
        cache.set(totalKey, currentTotal + latency, { ttl: 86400 }),
        cache.set(countKey, currentCount + 1, { ttl: 86400 }),
      ]);
    } else {
      await cache.increment({ type: 'cache_miss', date: dateKey });
      const totalKey = { type: 'cache_miss_latency_total', date: dateKey };
      const countKey = { type: 'cache_miss_latency_count', date: dateKey };
      const currentTotal = (await cache.get<number>(totalKey)) || 0;
      const currentCount = (await cache.get<number>(countKey)) || 0;
      await Promise.all([
        cache.set(totalKey, currentTotal + latency, { ttl: 86400 }),
        cache.set(countKey, currentCount + 1, { ttl: 86400 }),
      ]);
    }

  } catch (error) {
    logger.warn('Failed to track cache access:', error);
  }
}

// ============================================================================
// OBTENCIÓN DE MÉTRICAS
// ============================================================================

/**
 * Obtiene métricas de uso
 */
export async function getUsageMetrics(
  companyId: string,
  period: 'today' | 'week' | 'month' | 'year' = 'today'
): Promise<UsageMetrics> {
  try {
    const { startDate, endDate } = getPeriodDates(period);

    // Métricas de Features
    const [valuations, matches, incidents, marketingPosts] = await Promise.all([
      prisma.propertyValuation.count({
        where: { companyId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.tenantPropertyMatch.count({
        where: { companyId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.socialMediaPost.count({
        where: { companyId, createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    // Métricas de Usuarios
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({
        where: {
          companyId,
          lastLogin: { gte: startDate },
        },
      }),
      prisma.user.count({
        where: {
          companyId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Métricas de Propiedades
    const [properties, newProperties] = await Promise.all([
      prisma.unit.groupBy({
        by: ['estado'],
        where: { building: { companyId } },
        _count: true,
      }),
      prisma.unit.count({
        where: { building: { companyId }, createdAt: { gte: startDate } },
      }),
    ]);

    const totalProperties = properties.reduce((sum, p) => sum + p._count, 0);
    const rentedProperties = properties.find((p) => p.estado === 'rentada')?._count || 0;
    const availableProperties = properties.find((p) => p.estado === 'disponible')?._count || 0;

    const apiLogs = await prisma.apiLog.findMany({
      where: {
        companyId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        path: true,
        statusCode: true,
        responseTime: true,
      },
    });

    const totalRequests = apiLogs.length;
    const errorCount = apiLogs.filter((log) => log.statusCode >= 400).length;
    const avgResponseTime =
      totalRequests > 0
        ? Math.round(
            apiLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalRequests
          )
        : 0;

    const requestsByEndpoint = apiLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.path] = (acc[log.path] || 0) + 1;
      return acc;
    }, {});

    return {
      period,
      api: {
        totalRequests,
        requestsByEndpoint,
        avgResponseTime,
        errorRate: totalRequests > 0 ? Number(((errorCount / totalRequests) * 100).toFixed(1)) : 0,
      },
      features: {
        valuationsCount: valuations,
        matchesCount: matches,
        incidentsCount: incidents,
        marketingPostsCount: marketingPosts,
      },
      users: {
        activeUsers,
        newUsers,
        dailyActiveUsers: activeUsers,
      },
      properties: {
        totalProperties,
        newProperties,
        rentedProperties,
        availableProperties,
      },
    };

  } catch (error: any) {
    logger.error('Error getting usage metrics:', error);
    throw error;
  }
}

/**
 * Obtiene métricas de IA
 */
export async function getAIMetrics(
  companyId: string,
  period: 'today' | 'week' | 'month' | 'year' = 'today'
): Promise<AIMetrics> {
  try {
    const { startDate, endDate } = getPeriodDates(period);
    const dates = getDateRange(startDate, endDate);

    // Acumular métricas desde cache
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    
    const requestsByFeature = {
      valuations: 0,
      matching: 0,
      incidents: 0,
      marketing: 0,
    };

    const costsByFeature = {
      valuations: 0,
      matching: 0,
      incidents: 0,
      marketing: 0,
    };

    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      
      for (const feature of ['valuations', 'matching', 'incidents', 'marketing'] as const) {
        const requests = (await cache.get<number>({ type: 'ai_request', feature, date: dateKey })) || 0;
        const tokens = (await cache.get<number>({ type: 'ai_tokens', feature, date: dateKey })) || 0;
        const cost = (await cache.get<number>({ type: 'ai_cost', feature, date: dateKey })) || 0;

        totalRequests += requests;
        totalTokens += tokens;
        totalCost += cost;
        
        requestsByFeature[feature] += requests;
        costsByFeature[feature] += cost;
      }
    }

    const [commandsSuccess, commandsError, latencyTotals, latencyCounts] = await Promise.all([
      prisma.aICommand.count({
        where: {
          conversation: { companyId },
          createdAt: { gte: startDate, lte: endDate },
          exitoso: true,
        },
      }),
      prisma.aICommand.count({
        where: {
          conversation: { companyId },
          createdAt: { gte: startDate, lte: endDate },
          exitoso: false,
        },
      }),
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'ai_latency_total', date: dateKey })) || 0;
        })
      ),
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'ai_latency_count', date: dateKey })) || 0;
        })
      ),
    ]);

    const totalLatency = latencyTotals.reduce((sum, value) => sum + value, 0);
    const totalLatencyCount = latencyCounts.reduce((sum, value) => sum + value, 0);
    const avgLatency = totalLatencyCount > 0 ? Math.round(totalLatency / totalLatencyCount) : 0;

    const totalCommands = commandsSuccess + commandsError;

    return {
      period,
      usage: {
        totalRequests,
        requestsByFeature,
        totalTokens,
        inputTokens: Math.round(totalTokens * 0.6), // Estimado
        outputTokens: Math.round(totalTokens * 0.4),
      },
      costs: {
        total: Math.round(totalCost * 100) / 100,
        byFeature: {
          valuations: Math.round(costsByFeature.valuations * 100) / 100,
          matching: Math.round(costsByFeature.matching * 100) / 100,
          incidents: Math.round(costsByFeature.incidents * 100) / 100,
          marketing: Math.round(costsByFeature.marketing * 100) / 100,
        },
        avgCostPerRequest: totalRequests > 0 ? Math.round((totalCost / totalRequests) * 1000) / 1000 : 0,
      },
      performance: {
        avgLatency,
        successRate: totalCommands > 0 ? Math.round((commandsSuccess / totalCommands) * 1000) / 10 : 0,
        errorRate: totalCommands > 0 ? Math.round((commandsError / totalCommands) * 1000) / 10 : 0,
      },
    };

  } catch (error: any) {
    logger.error('Error getting AI metrics:', error);
    throw error;
  }
}

/**
 * Obtiene métricas de performance
 */
export async function getPerformanceMetrics(
  period: 'today' | 'week' | 'month' = 'today'
): Promise<PerformanceMetrics> {
  try {
    const { startDate, endDate } = getPeriodDates(period);
    const dates = getDateRange(startDate, endDate);

    let totalHits = 0;
    let totalMisses = 0;

    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      
      const hits = (await cache.get<number>({ type: 'cache_hit', date: dateKey })) || 0;
      const misses = (await cache.get<number>({ type: 'cache_miss', date: dateKey })) || 0;

      totalHits += hits;
      totalMisses += misses;
    }

    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    const [hitLatencyTotals, hitLatencyCounts, missLatencyTotals, missLatencyCounts] = await Promise.all([
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'cache_hit_latency_total', date: dateKey })) || 0;
        })
      ),
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'cache_hit_latency_count', date: dateKey })) || 0;
        })
      ),
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'cache_miss_latency_total', date: dateKey })) || 0;
        })
      ),
      Promise.all(
        dates.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          return (await cache.get<number>({ type: 'cache_miss_latency_count', date: dateKey })) || 0;
        })
      ),
    ]);

    const totalHitLatency = hitLatencyTotals.reduce((sum, value) => sum + value, 0);
    const totalHitLatencyCount = hitLatencyCounts.reduce((sum, value) => sum + value, 0);
    const totalMissLatency = missLatencyTotals.reduce((sum, value) => sum + value, 0);
    const totalMissLatencyCount = missLatencyCounts.reduce((sum, value) => sum + value, 0);

    const avgHitLatency =
      totalHitLatencyCount > 0 ? Math.round(totalHitLatency / totalHitLatencyCount) : 0;
    const avgMissLatency =
      totalMissLatencyCount > 0 ? Math.round(totalMissLatency / totalMissLatencyCount) : 0;

    const apiLogs = await prisma.apiLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      select: { responseTime: true },
    });

    const responseTimes = apiLogs
      .map((log) => log.responseTime || 0)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);

    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
        : 0;

    return {
      period,
      cache: {
        hitRate: Math.round(hitRate * 10) / 10,
        missRate: Math.round((100 - hitRate) * 10) / 10,
        totalRequests,
        hits: totalHits,
        misses: totalMisses,
        avgHitLatency,
        avgMissLatency,
      },
      database: {
        avgQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
      },
      api: {
        p50: calculatePercentile(responseTimes, 50),
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99),
        avgResponseTime,
      },
    };

  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    throw error;
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate: now };
}

function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  const safeIndex = Math.min(Math.max(index, 0), values.length - 1);
  return values[safeIndex];
}

/**
 * Obtiene tendencias analíticas para una empresa
 * IMPORTANTE: Excluye datos de demostración de las estadísticas
 */
export async function getAnalyticsTrends(
  companyId: string,
  months: number = 12
): Promise<{ companyId: string; trends: any[]; months: number }> {
  try {
    const now = new Date();
    const trends: any[] = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Filtro para excluir datos demo
    const excludeDemoFilter = {
      isDemo: false,
    };

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Contar datos del mes excluyendo demos
      const [buildings, units, tenants, contracts, payments] = await Promise.all([
        prisma.building.count({
          where: {
            companyId,
            ...excludeDemoFilter,
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.unit.count({
          where: {
            building: { companyId, ...excludeDemoFilter },
            ...excludeDemoFilter,
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.tenant.count({
          where: {
            companyId,
            ...excludeDemoFilter,
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.contract.count({
          where: {
            unit: { building: { companyId, ...excludeDemoFilter }, ...excludeDemoFilter },
            ...excludeDemoFilter,
            createdAt: { lte: monthEnd },
          },
        }),
        prisma.payment.aggregate({
          where: {
            contract: {
              unit: { building: { companyId, ...excludeDemoFilter }, ...excludeDemoFilter },
              ...excludeDemoFilter,
            },
            ...excludeDemoFilter,
            fechaVencimiento: { gte: monthStart, lte: monthEnd },
            estado: 'pagado',
          },
          _sum: { monto: true },
        }),
      ]);

      trends.push({
        month: monthNames[monthStart.getMonth()],
        year: monthStart.getFullYear(),
        buildings,
        units,
        tenants,
        contracts,
        revenue: payments._sum.monto || 0,
      });
    }

    return { companyId, trends, months };
  } catch (error: any) {
    logger.error('Error getting analytics trends:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES ADICIONALES DE ANALYTICS
// ============================================================================

/**
 * Genera métricas para un edificio específico
 */
export async function generateBuildingMetrics(buildingId: string) {
  try {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        units: {
          include: {
            contracts: {
              where: { status: 'activo' },
            },
          },
        },
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    const totalUnits = building.units.length;
    const occupiedUnits = building.units.filter(u => u.contracts.length > 0).length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const metrics = {
      buildingId,
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      fecha: new Date(),
      periodo: 'mensual',
    };

    // Guardar métricas si existe el modelo
    try {
      await prisma.buildingMetrics.create({
        data: metrics,
      });
    } catch {
      // Modelo puede no existir
    }

    return metrics;
  } catch (error: any) {
    logger.error('Error generating building metrics:', error);
    throw error;
  }
}

/**
 * Genera un snapshot de analytics para una compañía
 */
export async function generateAnalyticsSnapshot(companyId: string) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [buildings, units, tenants, contracts, payments] = await Promise.all([
      prisma.building.count({ where: { companyId } }),
      prisma.unit.count({ where: { building: { companyId } } }),
      prisma.tenant.count({ where: { companyId } }),
      prisma.contract.count({ where: { unit: { building: { companyId } }, status: 'activo' } }),
      prisma.payment.aggregate({
        where: {
          contract: { unit: { building: { companyId } } },
          fechaVencimiento: { gte: monthStart },
          estado: 'pagado',
        },
        _sum: { monto: true },
      }),
    ]);

    return {
      companyId,
      timestamp: now,
      metrics: {
        buildings,
        units,
        tenants,
        activeContracts: contracts,
        monthlyRevenue: payments._sum.monto || 0,
        occupancyRate: units > 0 ? Math.round((contracts / units) * 100) : 0,
      },
    };
  } catch (error: any) {
    logger.error('Error generating analytics snapshot:', error);
    throw error;
  }
}

/**
 * Analiza el comportamiento de inquilinos
 */
export async function analyzeTenantBehavior(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        contracts: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const allPayments = tenant.contracts.flatMap(c => c.payments);
    const latePayments = allPayments.filter(p => {
      if (!p.fechaPago || !p.fechaVencimiento) return false;
      return new Date(p.fechaPago) > new Date(p.fechaVencimiento);
    });

    return {
      tenantId,
      totalPayments: allPayments.length,
      latePayments: latePayments.length,
      paymentRate: allPayments.length > 0 
        ? Math.round(((allPayments.length - latePayments.length) / allPayments.length) * 100) 
        : 100,
      contractsCount: tenant.contracts.length,
      behavior: latePayments.length === 0 ? 'excellent' : latePayments.length < 3 ? 'good' : 'needs_attention',
    };
  } catch (error: any) {
    logger.error('Error analyzing tenant behavior:', error);
    throw error;
  }
}

/**
 * Registra un evento de analytics
 */
export async function trackEvent(
  eventName: string,
  data: Record<string, any>,
  userId?: string,
  companyId?: string
) {
  try {
    logger.info(`[Analytics Event] ${eventName}`, {
      event: eventName,
      data,
      userId,
      companyId,
      timestamp: new Date().toISOString(),
    });

    // Intentar guardar en BD si existe el modelo
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventName,
          eventData: data,
          userId,
          companyId,
          timestamp: new Date(),
        },
      });
    } catch {
      // Modelo puede no existir, solo loggeamos
    }

    return { success: true, event: eventName };
  } catch (error: any) {
    logger.error('Error tracking event:', error);
    return { success: false, error: error.message };
  }
}

export default {
  trackAPIRequest,
  trackAIUsage,
  trackCacheAccess,
  getUsageMetrics,
  getAIMetrics,
  getPerformanceMetrics,
  getAnalyticsTrends,
  generateBuildingMetrics,
  generateAnalyticsSnapshot,
  analyzeTenantBehavior,
  trackEvent,
};

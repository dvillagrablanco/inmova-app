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
    } else {
      await cache.increment({ type: 'cache_miss', date: dateKey });
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
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({
        where: {
          companyId,
          lastLogin: { gte: startDate },
        },
      }),
    ]);

    // Métricas de Propiedades
    const properties = await prisma.unit.groupBy({
      by: ['estado'],
      where: { building: { companyId } },
      _count: true,
    });

    const totalProperties = properties.reduce((sum, p) => sum + p._count, 0);
    const rentedProperties = properties.find((p) => p.estado === 'rentada')?._count || 0;
    const availableProperties = properties.find((p) => p.estado === 'disponible')?._count || 0;

    return {
      period,
      api: {
        totalRequests: 0, // Calculado desde cache
        requestsByEndpoint: {},
        avgResponseTime: 0,
        errorRate: 0,
      },
      features: {
        valuationsCount: valuations,
        matchesCount: matches,
        incidentsCount: incidents,
        marketingPostsCount: marketingPosts,
      },
      users: {
        activeUsers,
        newUsers: 0, // TODO: calcular
        dailyActiveUsers: activeUsers,
      },
      properties: {
        totalProperties,
        newProperties: 0, // TODO: calcular desde period
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
        avgLatency: 0, // TODO: calcular desde cache
        successRate: 0,
        errorRate: 0,
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

    return {
      period,
      cache: {
        hitRate: Math.round(hitRate * 10) / 10,
        missRate: Math.round((100 - hitRate) * 10) / 10,
        totalRequests,
        hits: totalHits,
        misses: totalMisses,
        avgHitLatency: 10, // Mock - calcular real desde logs
        avgMissLatency: 250, // Mock
      },
      database: {
        avgQueryTime: 50, // Mock - integrar con Prisma metrics
        slowQueries: 0,
        totalQueries: 0,
      },
      api: {
        p50: 200, // Mock
        p95: 500,
        p99: 1000,
        avgResponseTime: 300,
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

export default {
  trackAPIRequest,
  trackAIUsage,
  trackCacheAccess,
  getUsageMetrics,
  getAIMetrics,
  getPerformanceMetrics,
};

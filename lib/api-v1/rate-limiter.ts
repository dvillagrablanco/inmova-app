/**
 * API v1 - Rate Limiting
 * Limita requests por companyId (no por IP)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:6379',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limiter global (1000 req/min por defecto)
export const apiV1RateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'api:v1',
  analytics: true,
});

/**
 * Verificar rate limit para una empresa
 */
export async function checkRateLimit(
  companyId: string,
  customLimit?: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    // Si hay un límite custom (de la API key), crear rate limiter específico
    if (customLimit && customLimit !== 1000) {
      const customLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(customLimit, '1 m'),
        prefix: `api:v1:${companyId}`,
      });

      const result = await customLimiter.limit(companyId);
      return result;
    }

    // Usar rate limiter global
    const result = await apiV1RateLimiter.limit(companyId);
    return result;
  } catch (error) {
    console.error('[Rate Limiter Error]:', error);

    // En caso de error de Redis, permitir el request (fail-open)
    return {
      success: true,
      limit: customLimit || 1000,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Obtener estadísticas de uso de API
 */
export async function getApiUsageStats(
  companyId: string,
  period: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<{
  requests: number;
  errors: number;
  avgResponseTime: number;
}> {
  try {
    // Calcular timestamp de inicio
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Obtener logs
    const logs = await prisma.apiLog.findMany({
      where: {
        companyId,
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        statusCode: true,
        responseTime: true,
      },
    });

    const totalRequests = logs.length;
    const errors = logs.filter((l) => l.statusCode >= 400).length;
    const avgResponseTime =
      totalRequests > 0
        ? logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / totalRequests
        : 0;

    return {
      requests: totalRequests,
      errors,
      avgResponseTime: Math.round(avgResponseTime),
    };
  } catch (error) {
    console.error('[API Usage Stats Error]:', error);
    return {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
    };
  }
}

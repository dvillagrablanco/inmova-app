/**
 * Rate Limiting Middleware - Hibrido Redis/Memoria
 * 
 * Usa Redis cuando esta disponible (produccion con PM2 cluster)
 * para compartir limites entre workers. Fallback a Map en memoria
 * cuando Redis no esta configurado.
 * 
 * AUDITORIA 2026-02-11: Migrado de in-memory puro a Redis+fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Configuracion de rate limits por endpoint
interface RateLimitConfig {
  interval: number; // Ventana de tiempo en ms
  uniqueTokenPerInterval: number; // Maximo de requests permitidos
}

// Rate limits por tipo de operacion - SEGURIDAD BALANCEADA
export const RATE_LIMITS = {
  // Auth endpoints - estricto para prevenir brute force
  auth: {
    interval: 5 * 60 * 1000, // 5 minutos
    uniqueTokenPerInterval: 10,
  },
  // Payment endpoints - moderado
  payment: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 50,
  },
  // API general - balanceado
  api: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 100,
  },
  // Lectura - permisivo pero razonable
  read: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 200,
  },
  // Admin - permisivo para operaciones legitimas
  admin: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
  },
} as const;

// ============================================================
// BACKEND: Redis (produccion) con fallback a Map (desarrollo)
// ============================================================

// Fallback in-memory cache
const tokenCache = new Map<string, { timestamps: number[]; lastCleanup: number }>();

// Limpiar entradas antiguas cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000;
      for (const [key, value] of tokenCache.entries()) {
        if (now - value.lastCleanup > maxAge) {
          tokenCache.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

/**
 * Intenta obtener Redis client (lazy, no falla si no disponible)
 */
async function getRedis(): Promise<any | null> {
  try {
    const { getRedisClient } = await import('@/lib/redis');
    const client = getRedisClient();
    if (client) {
      await client.ping();
      return client;
    }
  } catch {
    // Redis no disponible, usar fallback
  }
  return null;
}

/**
 * Rate limit check via Redis (distribuido, compatible con cluster PM2)
 */
async function checkRateLimitRedis(
  redis: any,
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:${identifier}`;
  const windowSec = Math.ceil(config.interval / 1000);

  try {
    // INCR atomico + TTL
    const current = await redis.incr(key);

    if (current === 1) {
      // Primera request en esta ventana, setear TTL
      await redis.expire(key, windowSec);
    }

    const ttl = await redis.ttl(key);

    if (current > config.uniqueTokenPerInterval) {
      return {
        success: false,
        remaining: 0,
        reset: ttl > 0 ? ttl : windowSec,
      };
    }

    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - current,
      reset: ttl > 0 ? ttl : windowSec,
    };
  } catch (error) {
    logger.warn('[RateLimit] Redis error, fallback a memoria:', error);
    // Fallback a memoria si Redis falla
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Rate limit check via memoria (fallback)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = tokenCache.get(identifier) || { timestamps: [], lastCleanup: now };

  const validTimestamps = record.timestamps.filter(
    (timestamp) => now - timestamp < config.interval
  );

  if (validTimestamps.length >= config.uniqueTokenPerInterval) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const reset = oldestTimestamp + config.interval;
    return {
      success: false,
      remaining: 0,
      reset: Math.ceil((reset - now) / 1000),
    };
  }

  validTimestamps.push(now);
  tokenCache.set(identifier, { timestamps: validTimestamps, lastCleanup: now });

  return {
    success: true,
    remaining: config.uniqueTokenPerInterval - validTimestamps.length,
    reset: Math.ceil(config.interval / 1000),
  };
}

/**
 * Check rate limit (auto-selecciona Redis o memoria)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const redis = await getRedis();
  if (redis) {
    return checkRateLimitRedis(redis, identifier, config);
  }
  return checkRateLimitMemory(identifier, config);
}

/**
 * Obtiene el identificador unico del cliente (IP o user ID)
 */
function getClientIdentifier(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  const ip = cfIp || forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Determina el tipo de rate limit basado en la ruta
 */
function getRateLimitType(pathname: string, method?: string): keyof typeof RATE_LIMITS {
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    return 'admin';
  }
  if (pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/signup')) {
    return 'auth';
  }
  if (
    pathname.includes('/payment') ||
    pathname.includes('/stripe') ||
    pathname.includes('/pagos')
  ) {
    return 'payment';
  }
  if (pathname.startsWith('/api/') && (method === 'GET' || method === 'HEAD')) {
    return 'read';
  }
  return 'api';
}

/**
 * Middleware de rate limiting
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname.startsWith('/public')
  ) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  const limitType = getRateLimitType(pathname, request.method);
  const config = RATE_LIMITS[limitType];

  const result = await checkRateLimit(`${limitType}:${identifier}`, config);

  const headers = new Headers();
  headers.set('X-RateLimit-Limit', config.uniqueTokenPerInterval.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.reset} seconds.`,
        retryAfter: result.reset,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

/**
 * Helper para aplicar rate limiting en API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  customConfig?: RateLimitConfig
): Promise<NextResponse> {
  const identifier = getClientIdentifier(request);
  const config = customConfig || RATE_LIMITS.api;

  const result = await checkRateLimit(`api:${identifier}`, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.reset} seconds.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.uniqueTokenPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': result.reset.toString(),
        },
      }
    );
  }

  const response = await handler();

  response.headers.set('X-RateLimit-Limit', config.uniqueTokenPerInterval.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

/**
 * Rate limiting especifico para autenticacion (mas restrictivo)
 */
export async function withAuthRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return withRateLimit(request, handler, RATE_LIMITS.auth);
}

/**
 * Rate limiting especifico para pagos (restrictivo)
 */
export async function withPaymentRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return withRateLimit(request, handler, RATE_LIMITS.payment);
}

/**
 * Limpiar cache de rate limit (util para testing)
 */
export function clearRateLimitCache(): void {
  tokenCache.clear();
}

/**
 * Obtener estadisticas de rate limiting
 */
export function getRateLimitStats(): {
  cacheSize: number;
  maxSize: number;
  backend: string;
} {
  return {
    cacheSize: tokenCache.size,
    maxSize: 500,
    backend: process.env.REDIS_URL || process.env.REDIS_HOST ? 'redis+memory-fallback' : 'memory-only',
  };
}

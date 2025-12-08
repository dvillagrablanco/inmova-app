/**
 * Rate Limiting distribuido usando Upstash Rate Limit
 * Con fallback a rate limiting in-memory si Redis no está disponible
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis-config';
import logger from './logger';

/**
 * Configuraciones de rate limit predefinidas
 */
export const RATE_LIMITS = {
  // API endpoints públicos
  PUBLIC_API: {
    requests: 100,
    window: '1 m', // 100 requests por minuto
  },
  
  // API endpoints autenticados (más permisivos)
  AUTHENTICATED_API: {
    requests: 300,
    window: '1 m', // 300 requests por minuto
  },
  
  // Operaciones de escritura (más restrictivo)
  WRITE_OPERATIONS: {
    requests: 50,
    window: '1 m', // 50 requests por minuto
  },
  
  // Login attempts (muy restrictivo)
  LOGIN_ATTEMPTS: {
    requests: 5,
    window: '15 m', // 5 intentos cada 15 minutos
  },
  
  // Password reset
  PASSWORD_RESET: {
    requests: 3,
    window: '1 h', // 3 intentos por hora
  },
  
  // Email sending
  EMAIL_SEND: {
    requests: 20,
    window: '1 h', // 20 emails por hora
  },
  
  // Report generation (costoso)
  REPORT_GENERATION: {
    requests: 10,
    window: '1 h', // 10 reportes por hora
  },
  
  // File uploads
  FILE_UPLOAD: {
    requests: 30,
    window: '1 h', // 30 archivos por hora
  },
} as const;

/**
 * Tipo para identificar el tipo de rate limit
 */
export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Cache in-memory para fallback cuando Redis no está disponible
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetAt) {
        this.store.delete(key);
      }
    }
  }

  check(key: string, limit: number, windowMs: number): { success: boolean; remaining: number; reset: Date } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Si no existe o ya expiró, crear nueva entrada
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        success: true,
        remaining: limit - 1,
        reset: new Date(resetAt),
      };
    }

    // Si alcanzó el límite
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: new Date(entry.resetAt),
      };
    }

    // Incrementar contador
    entry.count++;
    this.store.set(key, entry);

    return {
      success: true,
      remaining: limit - entry.count,
      reset: new Date(entry.resetAt),
    };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Convierte string de duración a milisegundos
 */
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(ms|s|m|h|d)/);
  if (!match) return 60000; // default 1 minuto

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  return value * (multipliers[unit] || 1000);
}

/**
 * Crea un rate limiter para un tipo específico
 */
export function createRateLimiter(type: RateLimitType): Ratelimit | null {
  const config = RATE_LIMITS[type];
  
  // Si Redis está disponible, usar Upstash Rate Limit
  if (redis) {
    try {
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        prefix: `ratelimit:${type.toLowerCase()}`,
        analytics: true,
      });
    } catch (error) {
      logger.error(`Failed to create rate limiter for ${type}:`, error);
    }
  }
  
  // Redis no disponible, usar fallback in-memory
  logger.warn(`Redis not available, using in-memory rate limiter for ${type}`);
  return null;
}

/**
 * Cache de rate limiters
 */
const rateLimiters: Partial<Record<RateLimitType, Ratelimit | null>> = {};

/**
 * Obtiene o crea un rate limiter para un tipo
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  if (!rateLimiters[type]) {
    rateLimiters[type] = createRateLimiter(type);
  }
  return rateLimiters[type] || null;
}

/**
 * Verifica si una operación está permitida según el rate limit
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const limiter = getRateLimiter(type);
  const config = RATE_LIMITS[type];

  // Si hay Redis disponible, usar Upstash
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      };
    } catch (error) {
      logger.error(`Rate limit check failed for ${type}:`, error);
      // En caso de error, permitir la operación para no bloquear el servicio
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests,
        reset: new Date(Date.now() + parseDuration(config.window)),
      };
    }
  }

  // Fallback a rate limiter in-memory
  const windowMs = parseDuration(config.window);
  const result = inMemoryLimiter.check(
    `${type}:${identifier}`,
    config.requests,
    windowMs
  );

  return {
    success: result.success,
    limit: config.requests,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Middleware helper para aplicar rate limiting en API routes
 */
export async function withRateLimit(
  type: RateLimitType,
  identifier: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await checkRateLimit(type, identifier);

  // Agregar headers de rate limit
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  });

  // Si excedió el límite
  if (!result.success) {
    const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries()),
        },
      }
    );
  }

  // Ejecutar el handler y agregar headers
  const response = await handler();
  
  // Clonar response para agregar headers
  const newResponse = new Response(response.body, response);
  headers.forEach((value, key) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

/**
 * Helper para obtener un identificador único del request
 * Usa IP, user ID, o API key según disponibilidad
 */
export function getRequestIdentifier(
  request: Request,
  userId?: string
): string {
  // Preferir user ID si está autenticado
  if (userId) {
    return `user:${userId}`;
  }

  // Obtener IP del request
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  return `ip:${ip}`;
}

/**
 * Obtiene estadísticas de rate limiting
 */
export async function getRateLimitStats(type: RateLimitType): Promise<any> {
  const limiter = getRateLimiter(type);
  
  if (!limiter) {
    return {
      available: false,
      fallback: 'in-memory',
      config: RATE_LIMITS[type],
    };
  }

  return {
    available: true,
    config: RATE_LIMITS[type],
    storage: 'redis',
  };
}

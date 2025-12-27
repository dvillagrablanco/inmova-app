/**
 * Rate Limiting Middleware
 * Implementa rate limiting global para todas las APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// Configuración de rate limits por endpoint
interface RateLimitConfig {
  interval: number; // Ventana de tiempo en ms
  uniqueTokenPerInterval: number; // Máximo de requests permitidos
}

// Rate limits por tipo de operación
export const RATE_LIMITS = {
  // Auth endpoints - más restrictivo (solo POST de login)
  auth: {
    interval: 60 * 1000, // 1 minuto
    uniqueTokenPerInterval: 10, // 10 intentos por minuto (aumentado de 5)
  },
  // Payment endpoints - restrictivo
  payment: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 10,
  },
  // API general - moderado
  api: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 60, // 60 requests por minuto
  },
  // Lectura - permisivo (incluye GET de páginas de login)
  read: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 200, // 200 requests por minuto (muy permisivo)
  },
} as const;

// Cache para almacenar contadores de rate limit
const tokenCache = new LRUCache<string, number[]>({
  max: 500, // Máximo 500 IPs únicas en cache
  ttl: 60000, // TTL de 1 minuto
});

/**
 * Obtiene el identificador único del cliente (IP o user ID)
 */
function getClientIdentifier(request: NextRequest): string {
  // Priorizar user ID si está autenticado
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  // Usar IP como fallback
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Determina el tipo de rate limit basado en la ruta y método
 */
function getRateLimitType(pathname: string, method: string): keyof typeof RATE_LIMITS {
  // Endpoints de autenticación - restrictivo solo para POST
  if (pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/register')) {
    // GET para cargar formulario - permisivo
    if (method === 'GET' || method === 'HEAD') {
      return 'read';
    }
    // POST para autenticar - restrictivo
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
 * Verifica si el cliente ha excedido el rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const timestamps = tokenCache.get(identifier) || [];

  // Filtrar timestamps que están dentro de la ventana de tiempo
  const validTimestamps = timestamps.filter((timestamp) => now - timestamp < config.interval);

  // Verificar si excede el límite
  if (validTimestamps.length >= config.uniqueTokenPerInterval) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const reset = oldestTimestamp + config.interval;

    return {
      success: false,
      remaining: 0,
      reset: Math.ceil((reset - now) / 1000), // Segundos hasta reset
    };
  }

  // Agregar el nuevo timestamp
  validTimestamps.push(now);
  tokenCache.set(identifier, validTimestamps);

  return {
    success: true,
    remaining: config.uniqueTokenPerInterval - validTimestamps.length,
    reset: Math.ceil(config.interval / 1000),
  };
}

/**
 * Middleware de rate limiting
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Excluir rutas estáticas y de salud
  const { pathname } = request.nextUrl;
  const { method } = request;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname.startsWith('/public')
  ) {
    return null; // No aplicar rate limiting
  }

  // En desarrollo, ser más permisivo
  if (process.env.NODE_ENV === 'development') {
    // Solo limitar agresivamente POST de autenticación
    if (method !== 'POST' || !pathname.includes('/api/')) {
      return null;
    }
  }

  const identifier = getClientIdentifier(request);
  const limitType = getRateLimitType(pathname, method);
  const config = RATE_LIMITS[limitType];

  const result = checkRateLimit(identifier, config);

  // Agregar headers de rate limit en todas las respuestas
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', config.uniqueTokenPerInterval.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.success) {
    // Rate limit excedido
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

  // Rate limit OK - continuar con la petición
  // Los headers se agregarán en el response final
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

  const result = checkRateLimit(identifier, config);

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

  // Ejecutar el handler
  const response = await handler();

  // Agregar headers de rate limit
  response.headers.set('X-RateLimit-Limit', config.uniqueTokenPerInterval.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

/**
 * Rate limiting específico para autenticación (más restrictivo)
 */
export async function withAuthRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return withRateLimit(request, handler, RATE_LIMITS.auth);
}

/**
 * Rate limiting específico para pagos (restrictivo)
 */
export async function withPaymentRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return withRateLimit(request, handler, RATE_LIMITS.payment);
}

/**
 * Limpiar cache de rate limit (útil para testing)
 */
export function clearRateLimitCache(): void {
  tokenCache.clear();
}

/**
 * Obtener estadísticas de rate limiting
 */
export function getRateLimitStats(): {
  cacheSize: number;
  maxSize: number;
} {
  return {
    cacheSize: tokenCache.size,
    maxSize: tokenCache.max,
  };
}

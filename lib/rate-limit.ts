/**
 * Sistema de Rate Limiting con soporte para Redis (producción) o Memoria (desarrollo)
 * 
 * En producción, se recomienda usar Redis para compartir límites entre múltiples instancias
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  requests: number; // Número máximo de requests
  window: number; // Ventana de tiempo en milisegundos
  message?: string; // Mensaje personalizado
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Almacenamiento en memoria (desarrollo)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Limpia entradas expiradas del store de memoria (para evitar memory leaks)
 */
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}

// Limpiar entradas expiradas cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(cleanExpiredEntries, 5 * 60 * 1000);
}

/**
 * Verifica si una request excede el rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    // Nueva ventana de tiempo
    const resetTime = now + config.window;
    memoryStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: config.requests - 1, resetTime };
  }

  if (record.count >= config.requests) {
    // Límite excedido
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Incrementar contador
  record.count++;
  memoryStore.set(identifier, record);
  return {
    allowed: true,
    remaining: config.requests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Helper para aplicar rate limiting en API routes
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Obtener identificador (IP + pathname)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const identifier = `${ip}:${req.nextUrl.pathname}`;

    // Verificar rate limit
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: config.message || `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config.requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetTime),
            'Retry-After': String(resetIn),
          },
        }
      );
    }

    // Ejecutar handler
    const response = await handler(req, ...args);

    // Agregar headers de rate limit a la respuesta
    response.headers.set('X-RateLimit-Limit', String(config.requests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));

    return response;
  };
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const RATE_LIMIT_CONFIGS = {
  // Autenticación: límite estricto
  auth: {
    requests: 5,
    window: 60 * 1000, // 1 minuto
    message: 'Too many authentication attempts. Please try again later.',
  },
  // API general: límite moderado
  api: {
    requests: 100,
    window: 60 * 1000, // 1 minuto
  },
  // Pagos: límite conservador
  payment: {
    requests: 10,
    window: 60 * 1000, // 1 minuto
    message: 'Too many payment requests. Please try again later.',
  },
  // Uploads: límite muy conservador
  upload: {
    requests: 5,
    window: 60 * 1000, // 1 minuto
    message: 'Too many upload attempts. Please try again later.',
  },
  // Búsquedas: límite generoso
  search: {
    requests: 200,
    window: 60 * 1000, // 1 minuto
  },
};

/**
 * Ejemplo de uso en una API route:
 * 
 * export const POST = withRateLimit(
 *   async (req: NextRequest) => {
 *     // Tu lógica aquí
 *     return NextResponse.json({ success: true });
 *   },
 *   RATE_LIMIT_CONFIGS.auth
 * );
 */

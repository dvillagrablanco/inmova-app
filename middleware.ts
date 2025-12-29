import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Limpiar store cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.reset < now) {
          rateLimitStore.delete(key);
        }
      }
    },
    10 * 60 * 1000
  );
}

// Configuración de rate limiting por ruta
const RATE_LIMITS = {
  '/api/auth': { requests: 5, window: 60 * 1000 }, // 5 req/min
  '/api/payment': { requests: 10, window: 60 * 1000 }, // 10 req/min
  '/api': { requests: 100, window: 60 * 1000 }, // 100 req/min default
};

function getRateLimit(pathname: string) {
  // Buscar la configuración más específica
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return limit;
    }
  }
  return RATE_LIMITS['/api']; // Default
}

function checkRateLimit(ip: string, pathname: string) {
  const config = getRateLimit(pathname);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || record.reset < now) {
    // Nueva ventana
    rateLimitStore.set(key, {
      count: 1,
      reset: now + config.window,
    });
    return {
      allowed: true,
      remaining: config.requests - 1,
      reset: now + config.window,
      limit: config.requests,
    };
  }

  if (record.count >= config.requests) {
    // Rate limit excedido
    return {
      allowed: false,
      remaining: 0,
      reset: record.reset,
      limit: config.requests,
    };
  }

  // Incrementar contador
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: config.requests - record.count,
    reset: record.reset,
    limit: config.requests,
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo aplicar rate limiting a rutas API
  if (pathname.startsWith('/api/')) {
    const ip =
      request.ip ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(ip, pathname);

    const response = rateLimit.allowed
      ? NextResponse.next()
      : NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        );

    // Agregar headers de rate limiting
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());

    // Agregar headers de seguridad adicionales
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // Para rutas no-API, solo agregar headers de seguridad
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

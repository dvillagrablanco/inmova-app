/**
 * Middleware Global de Next.js
 * Aplica seguridad, rate limiting y CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from './lib/rate-limiting';
import { csrfProtectionMiddleware, addCsrfTokenToResponse } from './lib/csrf-protection';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult) {
    return rateLimitResult; // Rate limit excedido
  }

  // 2. CSRF Protection (solo para rutas API que modifican datos)
  if (pathname.startsWith('/api/')) {
    const csrfResult = await csrfProtectionMiddleware(request);
    if (csrfResult) {
      return csrfResult; // CSRF validation failed
    }
  }

  // 3. Security Headers
  const response = NextResponse.next();
  
  // Agregar headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS en producción
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  
  // Agregar CSRF token si es necesario
  if (!pathname.startsWith('/_next') && !pathname.startsWith('/api/')) {
    addCsrfTokenToResponse(response);
  }

  return response;
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

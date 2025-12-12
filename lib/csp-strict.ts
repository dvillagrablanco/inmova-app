/**
 * Content Security Policy (CSP) Estricto
 * Implementa headers de seguridad avanzados para prevenir XSS, clickjacking, etc.
 */

import { NextResponse } from 'next/server';

/**
 * Genera un nonce aleatorio y seguro para CSP
 * Compatible con Edge Runtime usando Web Crypto API
 */
export function generateNonce(): string {
  // Generar un UUID y convertirlo a base64 para usarlo como nonce
  // Esto es compatible con Edge Runtime
  const uuid = crypto.randomUUID();
  // Convertir UUID a bytes y luego a base64
  const buffer = new TextEncoder().encode(uuid);
  return btoa(String.fromCharCode(...buffer)).substring(0, 24);
}

/**
 * Aplica Content Security Policy estricto y otros headers de seguridad
 */
export function applyStrictCSP(response: NextResponse, nonce: string): NextResponse {
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live https://va.vercel-scripts.com`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
    `connect-src 'self' https://*.vercel.app https://*.pusher.com wss://*.pusher.com https://*.stripe.com https://api.openai.com https://va.vercel-scripts.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
    "object-src 'none'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  const csp = cspDirectives.join('; ');

  // Aplicar todos los headers de seguridad
  response.headers.set('Content-Security-Policy', csp);
  
  // Prevenir MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // XSS Protection (legacy pero aún útil)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (Feature Policy)
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);
  
  // Strict Transport Security (HSTS)
  // Solo en producción HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Cross-Origin Policies
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

/**
 * Genera CSP para páginas con contenido dinámico
 */
export function getCSPForPage(page: string, nonce: string): string {
  const baseCSP = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: https: blob:",
  ];

  // Agregar directivas específicas por página
  switch (page) {
    case '/dashboard':
      baseCSP.push("connect-src 'self' https://api.openai.com https://*.vercel.app");
      break;
    case '/payments':
      baseCSP.push("connect-src 'self' https://*.stripe.com");
      baseCSP.push("frame-src https://*.stripe.com");
      break;
    case '/analytics':
      baseCSP.push("connect-src 'self' https://www.google-analytics.com");
      break;
    default:
      baseCSP.push("connect-src 'self'");
  }

  return baseCSP.join('; ');
}

/**
 * Headers de seguridad para API routes
 */
export function applyAPISecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  
  // CORS headers (ajustar según necesidades)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  
  return response;
}

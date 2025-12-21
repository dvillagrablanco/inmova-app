import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Next.js con protecciones de seguridad
 * - IP Whitelisting para rutas /admin
 * - Security Headers
 * - Rate limiting básico (implementado en Nginx)
 */

// Obtener la IP real del cliente (considerando proxy de Cloudflare)
function getClientIP(request: NextRequest): string {
  // Cloudflare envía la IP real en CF-Connecting-IP
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback a X-Forwarded-For (puede contener múltiples IPs)
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback a X-Real-IP
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) return realIP;

  // Último fallback (no debería usarse en producción detrás de proxy)
  return request.ip || 'unknown';
}

// Verificar si una IP está en la lista blanca
function isIPWhitelisted(ip: string): boolean {
  // Lista blanca de IPs (configurable via variable de entorno)
  // Formato: IP1,IP2,IP3 o CIDR (por simplicidad, usamos IPs exactas)
  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(',').map(i => i.trim()) || [];
  
  // Si la lista está vacía, permitir todas las IPs (modo permisivo durante configuración inicial)
  if (whitelist.length === 0 || whitelist[0] === '') {
    return true;
  }

  // Verificar si la IP está en la lista blanca
  return whitelist.includes(ip);
}

// Logging de accesos a rutas /admin (para auditoría)
function logAdminAccess(ip: string, path: string, allowed: boolean) {
  const timestamp = new Date().toISOString();
  const status = allowed ? '✅ ALLOWED' : '🚫 BLOCKED';
  console.log(`[ADMIN ACCESS] ${timestamp} | ${status} | IP: ${ip} | Path: ${path}`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protección de IP Whitelisting para rutas /admin
  if (pathname.startsWith('/admin')) {
    const clientIP = getClientIP(request);
    const isAllowed = isIPWhitelisted(clientIP);
    
    // Siempre loggear accesos a /admin para auditoría
    logAdminAccess(clientIP, pathname, isAllowed);

    // Si no está permitido, bloquear acceso
    if (!isAllowed) {
      // Retornar 403 Forbidden con página custom
      return new NextResponse(
        JSON.stringify({
          error: 'Access Denied',
          message: 'Your IP address is not authorized to access this resource.',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }
  }

  // Protección similar para API /admin
  if (pathname.startsWith('/api/admin')) {
    const clientIP = getClientIP(request);
    const isAllowed = isIPWhitelisted(clientIP);
    
    logAdminAccess(clientIP, pathname, isAllowed);

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'Access Denied',
          message: 'Your IP address is not authorized to access this API.',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        },
        { 
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }
  }

  // Agregar security headers a todas las respuestas
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Ejecutar en:
     * - /admin y /api/admin (protección IP)
     * - Todas las demás rutas (security headers)
     * Excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - api/health (health check para monitoring)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/admin/:path*',
    '/admin/:path*',
  ],
};

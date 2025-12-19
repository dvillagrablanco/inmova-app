import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Next.js
 * Configuración mínima para evitar errores en deployment
 */

export function middleware(request: NextRequest) {
  // Simplemente continuar con la request
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

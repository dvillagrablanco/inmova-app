import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/csp';
import { rateLimiters, getRateLimitIdentifier, applyRateLimitHeaders } from '@/lib/rate-limit-enhanced';

// Rutas que requieren permisos específicos
const ROLE_PERMISSIONS = {
  super_admin: [
    '*', // Super admin tiene acceso a todo
  ],
  administrador: [
    '/dashboard',
    '/edificios',
    '/unidades',
    '/inquilinos',
    '/contratos',
    '/pagos',
    '/mantenimiento',
    '/proveedores',
    '/gastos',
    '/documentos',
    '/candidatos',
    '/reportes',
    '/admin',
    '/notificaciones',
  ],
  gestor: [
    '/dashboard',
    '/edificios',
    '/unidades',
    '/inquilinos',
    '/contratos',
    '/pagos',
    '/mantenimiento',
    '/proveedores',
    '/gastos',
    '/documentos',
    '/candidatos',
    '/reportes',
    '/notificaciones',
  ],
  operador: [
    '/dashboard',
    '/edificios',
    '/unidades',
    '/inquilinos',
    '/contratos',
    '/pagos',
    '/mantenimiento',
    '/notificaciones',
  ],
};

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;

    // Apply rate limiting
    const identifier = getRateLimitIdentifier(req as any);
    const rateLimitResult = await rateLimiters.public.checkLimit(identifier);

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as keyof typeof ROLE_PERMISSIONS;

    // Check rate limit
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message || 'Too many requests' },
        { status: 429 }
      );
      
      applyRateLimitHeaders(response.headers, rateLimitResult);
      applySecurityHeaders(response.headers);
      
      return response;
    }

    // Super admin tiene acceso a todo
    if (userRole === 'super_admin') {
      const response = NextResponse.next();
      
      // Apply security and rate limit headers
      applySecurityHeaders(response.headers);
      applyRateLimitHeaders(response.headers, rateLimitResult);
      
      return response;
    }

    // Verificar si el usuario tiene permisos para la ruta
    const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = allowedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!hasPermission && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    const response = NextResponse.next();
    
    // Apply security and rate limit headers
    applySecurityHeaders(response.headers);
    applyRateLimitHeaders(response.headers, rateLimitResult);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/edificios/:path*',
    '/unidades/:path*',
    '/inquilinos/:path*',
    '/contratos/:path*',
    '/pagos/:path*',
    '/mantenimiento/:path*',
    '/proveedores/:path*',
    '/gastos/:path*',
    '/documentos/:path*',
    '/candidatos/:path*',
    '/reportes/:path*',
    '/admin/:path*',
    '/notificaciones/:path*',
  ],
};

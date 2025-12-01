import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

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

// Security Headers
function getSecurityHeaders(nonce: string) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.s3.amazonaws.com https://*.cloudfront.net;
    font-src 'self' data:;
    connect-src 'self' https://api.stripe.com https://*.abacusai.app https://vercel.live;
    frame-src 'self' https://js.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  return {
    'Content-Security-Policy': cspHeader,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;

    // Generate nonce for CSP
    const nonce = Array.from(
      { length: 16 },
      () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as keyof typeof ROLE_PERMISSIONS;

    // Super admin tiene acceso a todo
    if (userRole === 'super_admin') {
      const response = NextResponse.next();
      
      // Apply security headers
      const securityHeaders = getSecurityHeaders(nonce);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('x-nonce', nonce);
      
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
    
    // Apply security headers
    const securityHeaders = getSecurityHeaders(nonce);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('x-nonce', nonce);

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

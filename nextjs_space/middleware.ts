import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Rutas que requieren permisos específicos
const ROLE_PERMISSIONS = {
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
  function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as keyof typeof ROLE_PERMISSIONS;

    // Verificar si el usuario tiene permisos para la ruta
    const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = allowedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!hasPermission && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
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

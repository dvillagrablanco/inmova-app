import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// Crear middleware de next-intl SOLO para rutas que lo necesitan
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // No prefix for default locale
  localeDetection: false, // Deshabilitar detección automática
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // LISTA BLANCA: Solo estas rutas usan i18n
  const i18nRoutes = [
    '/admin/settings/localization',
    '/dashboard/settings/language',
    // Agregar aquí más rutas que realmente necesiten i18n
  ];
  
  // LISTA NEGRA: Excluir estas rutas SIEMPRE
  const excludedRoutes = [
    '/api',
    '/_next',
    '/_vercel',
    '/landing',
    '/login',
    '/register',
    '/auth',
    '/unauthorized',
    '/health',
  ];
  
  // Excluir archivos estáticos (con extensión)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Excluir rutas en lista negra
  for (const route of excludedRoutes) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }
  
  // Solo aplicar i18n a rutas específicas que lo necesiten
  const needsI18n = i18nRoutes.some(route => pathname.startsWith(route));
  
  if (needsI18n) {
    try {
      // Aplicar middleware de next-intl solo si la ruta lo necesita
      return intlMiddleware(request);
    } catch (error) {
      // Si falla i18n, continuar sin i18n
      console.error('[Middleware] i18n error:', error);
      return NextResponse.next();
    }
  }
  
  // Para todas las demás rutas, pasar sin i18n
  return NextResponse.next();
}

export const config = {
  // Matcher MUY específico: solo rutas que potencialmente necesitan middleware
  // Excluye: api, _next, _vercel, archivos estáticos, landing, login, etc.
  matcher: [
    // Solo rutas de dashboard y admin que puedan necesitar i18n
    '/dashboard/:path*',
    '/admin/:path*',
    // Excluir todo lo demás
    '/((?!api|_next|_vercel|landing|login|register|auth|unauthorized|health|.*\\..*).*)',
  ],
};

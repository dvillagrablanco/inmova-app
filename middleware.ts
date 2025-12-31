import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // No prefix for default locale
  localeDetection: false, // Disable automatic detection to avoid issues
});

export const config = {
  // Matcher más específico que excluye rutas problemáticas
  matcher: [
    // Include all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - All files with extensions (e.g. .ico, .png, .jpg, etc.)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

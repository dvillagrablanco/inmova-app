import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // No prefix for default locale
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(es|en|pt)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};

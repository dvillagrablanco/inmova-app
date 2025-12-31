/**
 * next-intl Request Configuration
 *
 * Configuración server-side para next-intl
 */

import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validar que el locale es válido
  if (!locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    messages: (await import(`./locales/${locale}/common.json`)).default,
    timeZone: 'Europe/Madrid',
    now: new Date(),
  };
});

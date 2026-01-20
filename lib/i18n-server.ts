/**
 * Server-side i18n utilities
 * 
 * Para usar en Server Components y API Routes.
 */

import { cookies, headers } from 'next/headers';
import { Locale, getPreferredLocale, defaultLocale } from './i18n-config';

import logger from '@/lib/logger';
/**
 * Obtiene el locale actual del usuario (server-side)
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const headersList = headers();

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const acceptLanguage = headersList.get('accept-language') || undefined;

  return getPreferredLocale(cookieLocale, acceptLanguage);
}

/**
 * Carga las traducciones del locale especificado
 */
export async function getTranslations(locale: Locale) {
  try {
    const translations = await import(`@/i18n/locales/${locale}.json`);
    return translations.default;
  } catch (error) {
    logger.warn(`⚠️ Translations not found for locale: ${locale}, falling back to ${defaultLocale}`);
    const fallback = await import(`@/i18n/locales/${defaultLocale}.json`);
    return fallback.default;
  }
}

/**
 * Hook-like function para obtener función de traducción
 * 
 * Uso en Server Components:
 * ```
 * const t = await getTranslationFunction();
 * return <h1>{t('common.welcome')}</h1>;
 * ```
 */
export async function getTranslationFunction() {
  const locale = await getLocale();
  const translations = await getTranslations(locale);

  return function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        logger.warn(`⚠️ Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      logger.warn(`⚠️ Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  };
}

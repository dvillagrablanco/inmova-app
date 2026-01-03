/**
 * Configuración de Internacionalización (i18n)
 * 
 * Soporta 5 idiomas: ES, EN, FR, DE, IT
 * 
 * @module I18nConfig
 */

export const locales = ['es', 'en', 'fr', 'de', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
};

export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
};

/**
 * Detecta el idioma preferido del usuario desde:
 * 1. Cookie
 * 2. Header Accept-Language
 * 3. Default (ES)
 */
export function getPreferredLocale(
  cookieLocale?: string,
  acceptLanguage?: string
): Locale {
  // 1. Verificar cookie
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Verificar Accept-Language header
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase().substring(0, 2));

    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return browserLocale as Locale;
      }
    }
  }

  // 3. Default
  return defaultLocale;
}

/**
 * Verifica si un locale es válido
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

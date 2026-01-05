/**
 * i18n Configuration
 *
 * Configuración de internacionalización con next-intl
 * Soporta: ES, EN, PT, FR, DE, IT
 */

export const locales = ['es', 'en', 'pt', 'fr', 'de', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
};

export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  pt: '🇵🇹',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
};

// Namespace keys para organizar traducciones
export const namespaces = [
  'common',
  'auth',
  'dashboard',
  'properties',
  'tenants',
  'contracts',
  'payments',
  'maintenance',
  'settings',
  'errors',
  'validation',
] as const;

export type Namespace = (typeof namespaces)[number];

// Configuración de formato
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  es: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  en: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  pt: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  fr: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  de: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  it: {
    dateStyle: 'long',
    timeStyle: 'short',
  },
};

export const numberFormats: Record<Locale, Intl.NumberFormatOptions> = {
  es: {
    style: 'currency',
    currency: 'EUR',
  },
  en: {
    style: 'currency',
    currency: 'USD',
  },
  pt: {
    style: 'currency',
    currency: 'EUR',
  },
  fr: {
    style: 'currency',
    currency: 'EUR',
  },
  de: {
    style: 'currency',
    currency: 'EUR',
  },
  it: {
    style: 'currency',
    currency: 'EUR',
  },
};

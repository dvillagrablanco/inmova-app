/**
 * Client-side i18n utilities
 * 
 * Para usar en Client Components.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, isValidLocale } from './i18n-config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  initialTranslations?: Record<string, any>;
}

export function I18nProvider({ 
  children, 
  initialLocale = defaultLocale,
  initialTranslations = {}
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<Record<string, any>>(initialTranslations);

  useEffect(() => {
    // Load translations for current locale
    loadTranslations(locale);
  }, [locale]);

  const loadTranslations = async (newLocale: Locale) => {
    try {
      const response = await fetch(`/api/i18n/${newLocale}`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data.translations);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const setLocale = (newLocale: Locale) => {
    if (!isValidLocale(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}`);
      return;
    }

    setLocaleState(newLocale);

    // Save to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year

    // Reload page to apply locale change
    window.location.reload();
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
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

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

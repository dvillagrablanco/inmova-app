'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'es' | 'en' | 'fr' | 'pt';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Array<{ code: Locale; name: string; flag: string }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, any> = {
  es: require('@/locales/es.json'),
  en: require('@/locales/en.json'),
  fr: require('@/locales/fr.json'),
  pt: require('@/locales/pt.json'),
};

const availableLocales = [
  { code: 'es' as Locale, name: 'Español', flag: '🇪🇸' },
  { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Locale, name: 'Français', flag: '🇫🇷' },
  { code: 'pt' as Locale, name: 'Português', flag: '🇵🇹' },
];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Cargar idioma guardado o detectar del navegador
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['es', 'en', 'fr', 'pt'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0];
      if (['es', 'en', 'fr', 'pt'].includes(browserLang)) {
        setLocaleState(browserLang as Locale);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted) {
      localStorage.setItem('locale', newLocale);
      // Actualizar el atributo lang del HTML
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Soporte para interpolación de parámetros: {variable}
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales }}>
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

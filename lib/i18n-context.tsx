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

// ✅ FIX: Lazy load translations (no module scope)
let translationsCache: Record<Locale, any> | null = null;

const loadTranslations = async () => {
  if (translationsCache) return translationsCache;

  try {
    const [es, en, fr, pt] = await Promise.all([
      import('@/locales/es.json').then(m => m.default),
      import('@/locales/en.json').then(m => m.default),
      import('@/locales/fr.json').then(m => m.default),
      import('@/locales/pt.json').then(m => m.default),
    ]);

    translationsCache = { es, en, fr, pt };
    return translationsCache;
  } catch (error) {
    console.error('[I18n] Error loading translations:', error);
    // Fallback: empty translations
    translationsCache = { es: {}, en: {}, fr: {}, pt: {} };
    return translationsCache;
  }
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
  const [translations, setTranslations] = useState<Record<Locale, any> | null>(null);

  useEffect(() => {
    setMounted(true);

    // ✅ FIX: Load translations async
    loadTranslations().then(t => setTranslations(t));

    // ✅ FIX: Safe access to localStorage
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      // Actualizar el atributo lang del HTML
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // ✅ FIX: Esperar a que se carguen las traducciones
    if (!translations) return key;

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

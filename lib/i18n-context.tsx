'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Array<{ code: Locale; name: string; flag: string }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ✅ FIX: No usar require() en module scope - cargar async en useEffect
let translationsCache: Record<Locale, any> | null = null;

const loadTranslations = async (): Promise<Record<Locale, any>> => {
  if (translationsCache) return translationsCache;
  
  try {
    const [es, en, pt, fr, de, it] = await Promise.all([
      import('@/locales/es.json').then(m => m.default),
      import('@/locales/en.json').then(m => m.default),
      import('@/locales/pt.json').then(m => m.default),
      import('@/locales/fr.json').then(m => m.default),
      import('@/locales/de.json').then(m => m.default),
      import('@/locales/it.json').then(m => m.default),
    ]);
    
    translationsCache = { es, en, pt, fr, de, it };
    return translationsCache;
  } catch (error) {
    console.error('[I18n] Error loading translations:', error);
    return { es: {}, en: {}, pt: {}, fr: {}, de: {}, it: {} };
  }
};

const availableLocales = [
  { code: 'es' as Locale, name: 'Español', flag: '🇪🇸' },
  { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
  { code: 'pt' as Locale, name: 'Português', flag: '🇵🇹' },
  { code: 'fr' as Locale, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Locale, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Locale, name: 'Italiano', flag: '🇮🇹' },
];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [mounted, setMounted] = useState(false);
  const [translations, setTranslations] = useState<Record<Locale, any> | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // ✅ FIX: Cargar traducciones de forma asíncrona
    loadTranslations().then(t => setTranslations(t));
    
    // ✅ FIX: Guards SSR para browser APIs
    if (typeof window === 'undefined') return;
    
    // Cargar idioma guardado o detectar del navegador
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['es', 'en', 'pt', 'fr', 'de', 'it'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else if (typeof navigator !== 'undefined') {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0];
      if (['es', 'en', 'pt', 'fr', 'de', 'it'].includes(browserLang)) {
        setLocaleState(browserLang as Locale);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      if (typeof document !== 'undefined') {
        // Actualizar el atributo lang del HTML
        document.documentElement.lang = newLocale;
      }
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

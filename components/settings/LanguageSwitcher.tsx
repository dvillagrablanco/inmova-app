/**
 * Componente: Language Switcher
 * 
 * Selector de idioma para el usuario.
 * Funciona con o sin I18nProvider.
 */

'use client';

import { useState, useEffect } from 'react';
import { locales, localeNames, localeFlags, defaultLocale, type Locale } from '@/lib/i18n-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function getCookieLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  const val = match?.[1];
  if (val && (locales as readonly string[]).includes(val)) return val as Locale;
  return defaultLocale;
}

export function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(getCookieLocale());
  }, []);

  const handleChange = (newLocale: string) => {
    const loc = newLocale as Locale;
    setLocaleState(loc);
    document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Idioma
      </span>
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <span className="flex items-center space-x-2">
              <span>{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <span className="flex items-center space-x-2">
                <span>{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

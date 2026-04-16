'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { toast } from 'sonner';

type Locale = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it';

const availableLocales: Array<{ code: Locale; name: string; flag: string }> = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

function getCookieLocale(): Locale {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  const val = match?.[1];
  if (val && availableLocales.some((l) => l.code === val)) return val as Locale;
  return 'es';
}

export function LanguageSelector() {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    setLocaleState(getCookieLocale());
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
    const langName = availableLocales.find(l => l.code === newLocale)?.name || newLocale;
    if (newLocale !== 'es') {
      toast.info(`Idioma cambiado a ${langName}. La traducción completa está en desarrollo.`, { duration: 4000 });
    } else {
      toast.success(`Idioma cambiado a ${langName}`);
    }
    setTimeout(() => window.location.reload(), 500);
  };

  const currentFlag = availableLocales.find(l => l.code === locale)?.flag || '🌐';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-1.5 px-2">
          <span className="text-base">{currentFlag}</span>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLocales.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
            {locale === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

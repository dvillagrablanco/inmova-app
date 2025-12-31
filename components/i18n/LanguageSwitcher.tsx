'use client';

/**
 * Language Switcher Component
 *
 * Selector de idioma con flags y nombres
 * Persiste preferencia en localStorage + cookie
 */

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    setIsChanging(true);

    try {
      // Guardar preferencia en cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // Construir nueva URL con locale
      const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);

      // Recargar con nuevo locale
      router.push(newPathname);
      router.refresh();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={isChanging}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {localeFlags[currentLocale]} {localeNames[currentLocale]}
          </span>
          <span className="sm:hidden">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className="cursor-pointer gap-2"
          >
            <span className="text-lg">{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Uso en Header/Navbar:
 *
 * import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
 *
 * <LanguageSwitcher currentLocale={locale} />
 */

/**
 * Componente: Language Switcher
 * 
 * Selector de idioma para el usuario.
 */

'use client';

import { useTranslation } from '@/lib/i18n-client';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const handleChange = (newLocale: string) => {
    setLocale(newLocale as Locale);
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

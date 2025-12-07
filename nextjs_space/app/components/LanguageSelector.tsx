'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LanguageSelector() {
  const { locale, setLocale, availableLocales, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: 'es' | 'en' | 'fr' | 'pt') => {
    setLocale(newLocale);
    const selectedLocale = availableLocales.find((l) => l.code === newLocale);
    toast.success(`${t('settings.language')}: ${selectedLocale?.name}`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {availableLocales.find((l) => l.code === locale)?.name}
          </span>
          <span className="sm:hidden">{availableLocales.find((l) => l.code === locale)?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLocales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleLanguageChange(loc.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{loc.flag}</span>
              <span>{loc.name}</span>
            </span>
            {locale === loc.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

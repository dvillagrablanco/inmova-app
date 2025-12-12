"use client";

import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomTheme, customThemeLabels, customThemeDescriptions } from '@/hooks/use-custom-theme';

export function ThemeSelector() {
  const { customTheme, changeTheme } = useCustomTheme();

  const themes = [
    { value: 'light' as const, icon: '🌞' },
    { value: 'dark' as const, icon: '🌙' },
    { value: 'high-contrast' as const, icon: '🔆' },
    { value: 'night-mode' as const, icon: '🌃' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-tour="theme-selector">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Temas de Apariencia</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => changeTheme(theme.value)}
            className="flex items-start gap-3 cursor-pointer"
          >
            <span className="text-2xl">{theme.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{customThemeLabels[theme.value]}</span>
                {customTheme === theme.value && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customThemeDescriptions[theme.value]}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

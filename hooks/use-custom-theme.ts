import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export type CustomTheme = 'light' | 'dark' | 'high-contrast' | 'night-mode';

const STORAGE_KEY = 'inmova_custom_theme';

export function useCustomTheme() {
  const { setTheme } = useTheme();
  const [customTheme, setCustomTheme] = useState<CustomTheme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved custom theme from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CustomTheme | null;
      if (saved) {
        setCustomTheme(saved);
        applyCustomTheme(saved);
      }
    } catch (error) {
      console.error('Error loading custom theme:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const applyCustomTheme = (theme: CustomTheme) => {
    const root = document.documentElement;
    
    // Remove all custom theme classes
    root.classList.remove('high-contrast', 'night-mode');
    
    switch (theme) {
      case 'light':
        setTheme('light');
        break;
      case 'dark':
        setTheme('dark');
        break;
      case 'high-contrast':
        setTheme('light');
        root.classList.add('high-contrast');
        break;
      case 'night-mode':
        setTheme('dark');
        root.classList.add('night-mode');
        break;
    }
  };

  const changeTheme = (newTheme: CustomTheme) => {
    setCustomTheme(newTheme);
    applyCustomTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving custom theme:', error);
    }
  };

  return {
    customTheme,
    changeTheme,
    isLoaded,
  };
}

export const customThemeLabels: Record<CustomTheme, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  'high-contrast': 'Alto Contraste',
  'night-mode': 'Modo Nocturno',
};

export const customThemeDescriptions: Record<CustomTheme, string> = {
  light: 'Tema claro estándar',
  dark: 'Tema oscuro estándar',
  'high-contrast': 'Máximo contraste para mejor visibilidad',
  'night-mode': 'Optimizado para uso nocturno con colores cálidos',
};

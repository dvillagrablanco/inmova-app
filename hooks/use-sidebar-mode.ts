import { useEffect, useState } from 'react';

export type SidebarMode = 'full' | 'compact';

const STORAGE_KEY = 'inmova_sidebar_mode';

export function useSidebarMode() {
  const [mode, setMode] = useState<SidebarMode>('full');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved mode from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SidebarMode | null;
      if (saved && (saved === 'full' || saved === 'compact')) {
        setMode(saved);
      }
    } catch (error) {
      console.error('Error loading sidebar mode:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'full' ? 'compact' : 'full';
      try {
        localStorage.setItem(STORAGE_KEY, newMode);
      } catch (error) {
        console.error('Error saving sidebar mode:', error);
      }
      return newMode;
    });
  };

  const setModeDirectly = (newMode: SidebarMode) => {
    setMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving sidebar mode:', error);
    }
  };

  return {
    mode,
    toggleMode,
    setMode: setModeDirectly,
    isCompact: mode === 'compact',
    isLoaded,
  };
}

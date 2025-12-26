/**
 * CUSTOM HOOKS PARA DETECCIÓN MOBILE
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook para detectar el breakpoint actual
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        setBreakpoint('xs');
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint('sm');
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('md');
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint('lg');
      } else if (width < BREAKPOINTS['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook para detectar si es móvil
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook para detectar orientación del dispositivo
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);

    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
}

/**
 * Hook para detectar touch device
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Hook para detectar media queries y tipos de dispositivo
 * Optimizado para mobile-first approach con SSR/hidratación correcta
 */
import { useState, useEffect, useCallback } from 'react';

export function useMediaQuery(query: string): boolean {
  // Función para obtener el valor inicial de forma segura
  const getMatches = useCallback((query: string): boolean => {
    // En SSR, retornamos false por defecto
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, []);

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Asegurar que tenemos el valor correcto después del mount
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  // Durante SSR o antes del mount, retornamos false para evitar hydration mismatch
  if (!mounted) {
    return false;
  }

  return matches;
}

/**
 * Hook especializado para detectar dispositivos móviles
 * Retorna null durante SSR para evitar hydration mismatch
 */
export function useIsMobile(): boolean {
  const [mounted, setMounted] = useState(false);
  const isMobileQuery = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR, asumimos que puede ser móvil (mobile-first)
  // Esto evita que el bottom navigation parpadee
  if (!mounted) {
    // Intentar detectar móvil desde user agent si está disponible
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }
    return false;
  }

  return isMobileQuery;
}

/**
 * Hook para detectar tablets
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Hook para detectar desktop
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Hook para obtener el tipo de dispositivo actual
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook para detectar media queries y tipos de dispositivo
 * Optimizado para mobile-first approach
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia(query);
    if (!media) return;

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    if (typeof media.addListener === 'function') {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
}

/**
 * Hook especializado para detectar dispositivos móviles
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
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

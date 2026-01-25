/**
 * Hook para detectar media queries y tipos de dispositivo
 * Optimizado para mobile-first approach
 * 
 * IMPORTANTE: Usa un estado inicial undefined y solo se actualiza
 * después del montaje para evitar errores de hidratación de React
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Iniciar con undefined para evitar mismatch de hidratación
  // El valor real se obtiene solo en el cliente después del montaje
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    
    // Establecer valor inicial en cliente
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  // Retornar false mientras no esté montado (SSR) para evitar hydration mismatch
  return matches ?? false;
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

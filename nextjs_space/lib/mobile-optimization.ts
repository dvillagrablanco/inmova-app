/**
 * Mobile Optimization Utilities
 * Utilidades para mejorar la experiencia móvil
 */

import { useEffect, useState } from 'react';

/**
 * Hook para detectar si el usuario está en dispositivo móvil
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check inicial
    checkMobile();

    // Listener para cambios de tamaño
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook para detectar orientación del dispositivo
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return orientation;
}

/**
 * Hook para detectar conexión lenta
 */
export function useSlowConnection() {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        const checkConnection = () => {
          // Considerar conexión lenta si effectiveType es 'slow-2g', '2g', o '3g'
          const slowTypes = ['slow-2g', '2g', '3g'];
          setIsSlowConnection(slowTypes.includes(connection.effectiveType));
        };

        checkConnection();
        connection.addEventListener('change', checkConnection);
        return () => connection.removeEventListener('change', checkConnection);
      }
    }
  }, []);

  return isSlowConnection;
}

/**
 * Utilidad para optimizar imágenes según el dispositivo
 */
export function getOptimizedImageUrl(url: string, isMobile: boolean): string {
  if (!url) return '';
  
  // Si la imagen ya está optimizada o es un data URL, retornarla tal cual
  if (url.startsWith('data:') || url.includes('w=') || url.includes('q=')) {
    return url;
  }

  // Para imágenes de S3 o similares, agregar parámetros de optimización
  const separator = url.includes('?') ? '&' : '?';
  const width = isMobile ? '800' : '1920';
  const quality = isMobile ? '70' : '85';
  
  return `${url}${separator}w=${width}&q=${quality}`;
}

/**
 * Utilidad para lazy loading de imágenes
 */
export const lazyLoadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Debounce utility para optimizar eventos de scroll/resize
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility para limitar frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Utilidad para detectar soporte de gestos táctiles
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Utilidad para mejorar el tap en dispositivos táctiles
 */
export function improveTouch() {
  if (typeof document === 'undefined') return;

  // Eliminar delay de 300ms en taps
  document.addEventListener('touchstart', function() {}, { passive: true });
}

/**
 * Preload de recursos críticos
 */
export function preloadCriticalResources(urls: string[]) {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

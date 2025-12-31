/**
 * Performance Utilities
 * 
 * Herramientas para optimizar rendimiento de la aplicación
 */

/**
 * Debounce function
 * Retrasa la ejecución de una función hasta que pasen X ms sin llamadas
 * Útil para búsquedas en tiempo real, resize events, etc.
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
 * Throttle function
 * Limita la frecuencia de ejecución de una función a 1 vez cada X ms
 * Útil para scroll events, mouse move, etc.
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
 * Memoize function
 * Cachea resultados de funciones pesadas
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Measure performance
 * Mide el tiempo de ejecución de una función
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`⏱️ [Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ [Performance] ${name}: Failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Lazy load images with Intersection Observer
 * Carga imágenes solo cuando están cerca del viewport
 */
export function lazyLoadImage(imgElement: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgElement.src = src;
        imgElement.classList.add('loaded');
        observer.unobserve(imgElement);
      }
    });
  }, {
    rootMargin: '100px', // Cargar 100px antes de ser visible
  });

  observer.observe(imgElement);

  return () => observer.disconnect();
}

/**
 * Preload critical resources
 * Precarga recursos críticos para mejorar LCP
 */
export function preloadCriticalResources(resources: Array<{ href: string; as: string }>) {
  if (typeof window === 'undefined') return;

  resources.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = href;
    document.head.appendChild(link);
  });
}

/**
 * Optimize large lists with virtual scrolling
 * Para listas de 1000+ items
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return { startIndex, endIndex };
}

/**
 * Format large numbers for display
 * Optimiza rendering de números grandes
 */
export const formatNumber = memoize((num: number, locale: string = 'es-ES'): string => {
  return num.toLocaleString(locale);
});

/**
 * Check if user prefers reduced motion
 * Respeta preferencias de accesibilidad del usuario
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal image format support
 * Detecta soporte de formatos modernos (WebP, AVIF)
 */
export async function getSupportedImageFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (typeof window === 'undefined') return 'jpeg';

  // Check AVIF support
  const avifSupported = await checkImageSupport(
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABYAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  );
  if (avifSupported) return 'avif';

  // Check WebP support
  const webpSupported = await checkImageSupport(
    'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
  );
  if (webpSupported) return 'webp';

  return 'jpeg';
}

async function checkImageSupport(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

/**
 * Batch multiple state updates
 * Reduce re-renders agrupando actualizaciones
 */
export function batchUpdates<T extends Record<string, any>>(
  setState: (updates: Partial<T>) => void,
  updates: Partial<T>[]
): void {
  const merged = updates.reduce((acc, update) => ({ ...acc, ...update }), {});
  setState(merged);
}

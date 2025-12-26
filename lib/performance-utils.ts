/**
 * Utilidades para optimización de performance
 */

import { headers } from 'next/headers';

/**
 * Detecta si el cliente soporta formatos de imagen modernos
 */
export function supportsModernImageFormats(): boolean {
  if (typeof window === 'undefined') return true;

  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    return false;
  }

  // Check AVIF support
  const avifSupport = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  // Check WebP support
  const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

  return avifSupport || webpSupport;
}

/**
 * Calcula el tamaño de imagen óptimo basado en el viewport
 */
export function getOptimalImageSize(containerWidth: number): number {
  const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const targetWidth = containerWidth * dpr;

  return deviceSizes.find((size) => size >= targetWidth) || deviceSizes[deviceSizes.length - 1];
}

/**
 * Preload de recursos críticos
 */
export function preloadCriticalResources(resources: { href: string; as: string; type?: string }[]) {
  if (typeof window === 'undefined') return;

  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load de scripts
 */
export function lazyLoadScript(src: string, async = true): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Detecta conexión lenta
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return false;

  const slowTypes = ['slow-2g', '2g'];
  return slowTypes.includes(connection.effectiveType) || connection.saveData;
}

/**
 * Mide el performance de una función
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Debounce function para optimizar eventos
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function para optimizar eventos
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
 * Chunking de arrays grandes para prevenir bloqueo del UI
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]> | R[]
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);

    // Yield to browser to prevent blocking
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Memoización con TTL
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(fn: T, ttl: number = 60000): T {
  const cache = new Map<string, { value: any; timestamp: number }>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const value = fn(...args);
    cache.set(key, { value, timestamp: now });

    // Clean old entries
    setTimeout(() => {
      cache.forEach((val, k) => {
        if (now - val.timestamp >= ttl) {
          cache.delete(k);
        }
      });
    }, ttl);

    return value;
  }) as T;
}

/**
 * Intersection Observer hook para lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
}

/**
 * Resource hints para mejorar performance
 */
export function addResourceHints(hints: {
  preconnect?: string[];
  dnsPrefetch?: string[];
  prefetch?: string[];
}) {
  if (typeof document === 'undefined') return;

  // Preconnect
  hints.preconnect?.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS Prefetch
  hints.dnsPrefetch?.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  });

  // Prefetch
  hints.prefetch?.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

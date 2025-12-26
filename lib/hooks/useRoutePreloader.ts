'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

interface PreloadOptions {
  delay?: number;
  prefetchData?: boolean;
}

interface RouteDataPreloader {
  route: string;
  fetcher: () => Promise<any>;
}

const preloadCache = new Map<string, boolean>();
const dataCache = new Map<string, any>();

/**
 * Hook para precargar rutas y datos antes de la navegación
 * Mejora la percepción de velocidad al anticipar las acciones del usuario
 */
export function useRoutePreloader() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Precarga una ruta cuando el usuario hace hover
   */
  const preloadRoute = useCallback(
    (route: string, options: PreloadOptions = {}) => {
      const { delay = 200 } = options;

      // Evitar precargas duplicadas
      if (preloadCache.has(route)) {
        return;
      }

      timeoutRef.current = setTimeout(() => {
        try {
          // Usar router.prefetch de Next.js
          router.prefetch(route);
          preloadCache.set(route, true);

          // Log para debugging (remover en producción)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[RoutePreloader] Precargando ruta: ${route}`);
          }
        } catch (error) {
          console.error(`[RoutePreloader] Error precargando ${route}:`, error);
        }
      }, delay);
    },
    [router]
  );

  /**
   * Cancela una precarga pendiente
   */
  const cancelPreload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Precarga datos específicos para una ruta
   */
  const preloadData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    // Usar datos cacheados si existen
    if (dataCache.has(key)) {
      return dataCache.get(key);
    }

    try {
      const data = await fetcher();
      dataCache.set(key, data);
      return data;
    } catch (error) {
      console.error(`[RoutePreloader] Error precargando datos ${key}:`, error);
      return null;
    }
  }, []);

  /**
   * Obtiene datos precargados
   */
  const getCachedData = useCallback((key: string) => {
    return dataCache.get(key);
  }, []);

  /**
   * Limpia el cache de datos
   */
  const clearCache = useCallback((key?: string) => {
    if (key) {
      dataCache.delete(key);
      preloadCache.delete(key);
    } else {
      dataCache.clear();
      preloadCache.clear();
    }
  }, []);

  return {
    preloadRoute,
    cancelPreload,
    preloadData,
    getCachedData,
    clearCache,
  };
}

/**
 * Hook simplificado para precargar rutas en hover
 */
export function useHoverPreload(route: string, options?: PreloadOptions) {
  const { preloadRoute, cancelPreload } = useRoutePreloader();

  const handleMouseEnter = useCallback(() => {
    preloadRoute(route, options);
  }, [route, options, preloadRoute]);

  const handleMouseLeave = useCallback(() => {
    cancelPreload();
  }, [cancelPreload]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

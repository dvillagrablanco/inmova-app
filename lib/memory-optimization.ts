/**
 * Memory Optimization Utilities
 * Prevención de memory leaks y optimización de queries
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para limpiar efectos y prevenir memory leaks
 */
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}

/**
 * Hook para detectar memory leaks en desarrollo
 */
export function useMemoryLeakDetector(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Memory] Component mounted: ${componentName}`);

      return () => {
        console.log(`[Memory] Component unmounted: ${componentName}`);
      };
    }
  }, [componentName]);
}

/**
 * Hook para cancelar requests cuando el componente se desmonta
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Crear nuevo AbortController en mount
    abortControllerRef.current = new AbortController();

    return () => {
      // Cancelar requests al desmontar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return abortControllerRef.current?.signal;
}

/**
 * Hook para fetch con cleanup automático
 */
export function useSafeFetch<T>(
  url: string,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancelar request anterior si existe
    if (abortController.current) {
      abortController.current.abort();
    }

    // Crear nuevo AbortController
    abortController.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetch(url, {
        ...options,
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request fue cancelado, no hacer nada
        return;
      }
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();

    return () => {
      // Cleanup: cancelar request al desmontar
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Debounce function para optimizar renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Setear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle function para limitar frecuencia de llamadas
 */
export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook para prevenir múltiples llamadas simultáneas
 */
export function usePreventMultipleCalls() {
  const isCallingRef = useRef(false);

  return useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (isCallingRef.current) {
      console.warn('Prevented multiple simultaneous calls');
      return null;
    }

    try {
      isCallingRef.current = true;
      return await fn();
    } finally {
      isCallingRef.current = false;
    }
  }, []);
}

/**
 * Optimización de Prisma Queries
 */

// Helper para seleccionar solo campos necesarios
export function createSelectFields<T extends Record<string, boolean>>(fields: T): T {
  return fields;
}

// Template de query optimizada con paginación
export interface PaginatedQueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: any;
  where?: any;
}

export function createPaginatedQuery(options: PaginatedQueryOptions) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const skip = (page - 1) * pageSize;

  return {
    skip,
    take: pageSize,
    orderBy: options.orderBy,
    where: options.where,
  };
}

// Campos comunes para select (evitar N+1)
export const COMMON_SELECTS = {
  user: {
    id: true,
    nombre: true,
    apellidos: true,
    email: true,
    avatar: true,
    rol: true,
  },
  building: {
    id: true,
    nombre: true,
    direccion: true,
    ciudad: true,
    tipo: true,
  },
  contract: {
    id: true,
    numero: true,
    fechaInicio: true,
    fechaFin: true,
    renta: true,
    estado: true,
  },
  tenant: {
    id: true,
    nombre: true,
    apellidos: true,
    email: true,
    telefono: true,
  },
  payment: {
    id: true,
    monto: true,
    fecha: true,
    metodoPago: true,
    estado: true,
  },
};

/**
 * Helper para incluir relaciones sin N+1
 */
export function includeWithSelect<T extends Record<string, any>>(includes: T): T {
  return includes;
}

/**
 * Batch loading para prevenir N+1 queries
 * Usar con DataLoader en el backend
 */
export class BatchLoader<K, V> {
  private cache = new Map<K, Promise<V>>();
  private queue: K[] = [];
  private batchFn: (keys: K[]) => Promise<V[]>;

  constructor(batchFn: (keys: K[]) => Promise<V[]>) {
    this.batchFn = batchFn;
  }

  async load(key: K): Promise<V> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    this.queue.push(key);

    const promise = new Promise<V>((resolve, reject) => {
      // Ejecutar batch en el próximo tick
      process.nextTick(async () => {
        try {
          const keys = [...this.queue];
          this.queue = [];

          const results = await this.batchFn(keys);
          const index = keys.indexOf(key);
          resolve(results[index]);
        } catch (error) {
          reject(error);
        }
      });
    });

    this.cache.set(key, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.queue = [];
  }
}

/**
 * Limpieza de caché
 */
export function clearCache() {
  if (typeof window !== 'undefined') {
    // Limpiar cache del navegador
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
}

/**
 * Monitor de memoria (solo desarrollo)
 */
export function useMemoryMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof window === 'undefined') return;
    if (!(performance as any).memory) return;

    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

      console.log(`[Memory] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`);
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);
}

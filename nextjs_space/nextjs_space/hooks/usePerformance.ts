import { useEffect, useState, useCallback, useRef } from 'react';
import { debounce, throttle, isSlowConnection } from '@/lib/performance-utils';

/**
 * Hook para lazy loading con Intersection Observer
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, hasLoaded, options]);

  return { isVisible, hasLoaded };
}

/**
 * Hook para detectar viewport size con debounce
 */
export function useViewportSize(debounceMs: number = 200) {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debounceMs]);

  return size;
}

/**
 * Hook para scroll position con throttle
 */
export function useScrollPosition(throttleMs: number = 100) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = throttle(() => {
      setScrollY(window.scrollY);
    }, throttleMs);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttleMs]);

  return scrollY;
}

/**
 * Hook para detectar conexión lenta
 */
export function useSlowConnection() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!connection) return;

    const checkConnection = () => {
      setIsSlow(isSlowConnection());
    };

    checkConnection();
    connection.addEventListener('change', checkConnection);

    return () => {
      connection.removeEventListener('change', checkConnection);
    };
  }, []);

  return isSlow;
}

/**
 * Hook para prefetch de recursos
 */
export function usePrefetch() {
  const prefetch = useCallback((url: string, as: 'fetch' | 'document' | 'script' | 'style' = 'fetch') => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
  }, []);

  const preload = useCallback((url: string, as: 'fetch' | 'document' | 'script' | 'style' | 'font' = 'fetch') => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  }, []);

  return { prefetch, preload };
}

/**
 * Hook para idle callback
 */
export function useIdleCallback(callback: () => void, options?: IdleRequestOptions) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback para navegadores sin soporte
      const timeout = setTimeout(callback, 1);
      return () => clearTimeout(timeout);
    }

    const id = requestIdleCallback(callback, options);
    return () => cancelIdleCallback(id);
  }, [callback, options]);
}

/**
 * Hook para performance monitoring
 */
export function usePerformanceMonitor(metricName: string) {
  const startTime = useRef<number>();

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (!startTime.current) return;

    const duration = performance.now() - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`);
    }

    // Send to analytics if needed
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: metricName,
        value: Math.round(duration),
        event_category: 'Performance',
      });
    }

    startTime.current = undefined;
    return duration;
  }, [metricName]);

  return { start, end };
}

/**
 * Hook para virtual scrolling optimization
 */
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
    []
  );

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    handleScroll,
  };
}

/**
 * Hook para image loading optimization
 */
export function useImageLoad(src: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setLoading(false);
      setError(false);
    };

    img.onerror = () => {
      setLoading(false);
      setError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loading, error };
}

/**
 * Hook para batching de actualizaciones
 */
export function useBatchedUpdates<T>(initialValue: T, batchDelay: number = 100) {
  const [value, setValue] = useState(initialValue);
  const [pendingValue, setPendingValue] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(pendingValue ?? value)
        : newValue;

      setPendingValue(resolvedValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setValue(resolvedValue);
        setPendingValue(null);
      }, batchDelay);
    },
    [value, pendingValue, batchDelay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, updateValue] as const;
}

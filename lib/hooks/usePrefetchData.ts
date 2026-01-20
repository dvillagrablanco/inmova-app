import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import logger from '@/lib/logger';
interface PrefetchConfig {
  /**
   * URL to prefetch data from
   */
  url: string;
  /**
   * Whether to prefetch on mount
   */
  prefetchOnMount?: boolean;
  /**
   * Whether to prefetch on hover
   */
  prefetchOnHover?: boolean;
  /**
   * Delay before prefetching (in milliseconds)
   */
  delay?: number;
}

/**
 * Hook for prefetching data from critical routes
 * This improves perceived performance by loading data before navigation
 */
export function usePrefetchData(config: PrefetchConfig | PrefetchConfig[]) {
  const router = useRouter();
  const prefetchedUrls = useRef<Set<string>>(new Set());

  const configs = Array.isArray(config) ? config : [config];

  useEffect(() => {
    configs.forEach((cfg) => {
      if (cfg.prefetchOnMount !== false) {
        const timeoutId = setTimeout(() => {
          prefetchData(cfg.url);
        }, cfg.delay || 0);

        return () => clearTimeout(timeoutId);
      }
    });
  }, []);

  const prefetchData = async (url: string) => {
    if (prefetchedUrls.current.has(url)) {
      return; // Already prefetched
    }

    try {
      // Prefetch the data
      await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      prefetchedUrls.current.add(url);
    } catch (error) {
      // Silently fail - prefetching is not critical
      logger.warn(`Failed to prefetch ${url}:`, error);
    }
  };

  const createPrefetchHandlers = (url: string) => ({
    onMouseEnter: () => prefetchData(url),
    onFocus: () => prefetchData(url),
  });

  return {
    prefetchData,
    createPrefetchHandlers,
  };
}

/**
 * Hook for prefetching critical routes on mount
 * Useful for dashboard pages that need to load related data
 */
export function usePrefetchCriticalRoutes() {
  const criticalRoutes = [
    { url: '/api/buildings', delay: 500 },
    { url: '/api/units', delay: 1000 },
    { url: '/api/tenants', delay: 1500 },
    { url: '/api/contracts', delay: 2000 },
  ];

  usePrefetchData(criticalRoutes);
}

/**
 * Hook for prefetching dashboard data
 */
export function usePrefetchDashboard() {
  usePrefetchData({
    url: '/api/dashboard/data',
    prefetchOnMount: true,
    delay: 0,
  });
}

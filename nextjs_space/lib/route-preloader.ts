/**
 * Route Preloader
 * Automatically preloads routes based on user navigation patterns
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Route groups that should be preloaded together
 */
const ROUTE_GROUPS = {
  admin: [
    '/admin/clientes',
    '/admin/dashboard',
    '/admin/usuarios',
    '/admin/configuracion',
  ],
  marketplace: [
    '/marketplace',
    '/marketplace/servicios',
    '/marketplace/presupuestos',
  ],
  str: [
    '/str/listings',
    '/str/bookings',
    '/str/channels',
  ],
  flipping: [
    '/flipping/projects',
    '/flipping/analytics',
  ],
  construction: [
    '/construction/projects',
    '/construction/suppliers',
  ],
};

/**
 * Get related routes to preload based on current path
 */
function getRelatedRoutes(currentPath: string): string[] {
  for (const [groupName, routes] of Object.entries(ROUTE_GROUPS)) {
    if (routes.some(route => currentPath.startsWith(route))) {
      return routes.filter(route => route !== currentPath);
    }
  }
  return [];
}

/**
 * Hook to automatically preload related routes
 */
export function useRoutePreloader() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const relatedRoutes = getRelatedRoutes(pathname);
    
    // Preload after a short delay to avoid impacting initial load
    const timeoutId = setTimeout(() => {
      relatedRoutes.forEach(route => {
        // Use Next.js router prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);
}

/**
 * Component to enable route preloading
 */
export function RoutePreloader() {
  useRoutePreloader();
  return null;
}

/**
 * Lazy Route Component
 * Provides dynamic imports with loading states for route-level code splitting
 */

'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { LoadingState } from './loading-state';

interface LazyRouteOptions {
  loadingMessage?: string;
  fallback?: React.ReactNode;
  ssr?: boolean;
}

/**
 * Create a lazy-loaded route component
 */
export function createLazyRoute<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyRouteOptions = {}
) {
  const {
    loadingMessage = 'Cargando...',
    fallback,
    ssr = false,
  } = options;

  const LazyComponent = dynamic(importFn, {
    loading: () => (fallback as React.ReactElement) || <LoadingState message={loadingMessage} fullScreen />,
    ssr,
  });

  return function LazyRoute(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingState message={loadingMessage} fullScreen />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy route
 */
export function preloadRoute(importFn: () => Promise<any>) {
  importFn().catch(() => {
    // Silently fail preload
  });
}

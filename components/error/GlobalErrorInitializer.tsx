'use client';

/**
 * Global Error Initializer
 * 
 * Componente que inicializa el tracking global de errores.
 * Debe ser renderizado en el provider tree.
 */

import { useGlobalErrorHandler } from '@/lib/hooks/useGlobalErrorHandler';

export function GlobalErrorInitializer() {
  // Activa el tracking de errores globales (window.onerror, unhandledrejection)
  useGlobalErrorHandler({
    enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
  });

  return null;
}

export default GlobalErrorInitializer;

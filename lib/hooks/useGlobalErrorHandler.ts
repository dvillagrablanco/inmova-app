'use client';

/**
 * useGlobalErrorHandler Hook
 * 
 * Hook que configura listeners globales para capturar errores no manejados:
 * - window.onerror: Errores de JavaScript
 * - unhandledrejection: Promesas rechazadas sin catch
 * - error events: Errores de recursos (imágenes, scripts, etc.)
 * 
 * @usage
 * En tu layout principal:
 * useGlobalErrorHandler();
 */

import { useEffect } from 'react';

interface GlobalErrorContext {
  enabled?: boolean;
  onError?: (error: Error, context: any) => void;
}

export function useGlobalErrorHandler(options: GlobalErrorContext = {}) {
  const { enabled = true, onError } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Handler para errores de JavaScript
    const handleError = (event: ErrorEvent) => {
      const error = {
        name: 'JavaScriptError',
        message: event.message,
        stack: event.error?.stack,
        source: 'frontend',
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };

      // Reportar al backend
      reportError(error);

      // Callback personalizado
      if (onError) {
        onError(event.error || new Error(event.message), error.metadata);
      }
    };

    // Handler para promesas rechazadas sin catch
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const error = {
        name: reason?.name || 'UnhandledRejection',
        message: reason?.message || String(reason),
        stack: reason?.stack,
        source: 'frontend',
        url: window.location.href,
        metadata: {
          type: 'unhandled_promise_rejection',
          promiseDetails: typeof reason === 'object' ? JSON.stringify(reason).slice(0, 500) : String(reason),
        },
      };

      // Reportar al backend
      reportError(error);

      // Callback personalizado
      if (onError) {
        onError(reason instanceof Error ? reason : new Error(String(reason)), error.metadata);
      }
    };

    // Función para reportar errores
    const reportError = async (errorData: any) => {
      try {
        await fetch('/api/errors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        });
      } catch (e) {
        // No hacer nada si falla el reporte (evitar loops)
        console.error('[GlobalErrorHandler] Failed to report error:', e);
      }
    };

    // Registrar listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, onError]);
}

export default useGlobalErrorHandler;

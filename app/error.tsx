'use client';

/**
 * Global Error Page
 * Captura errores no manejados en la aplicación
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global error:', error);
    
    // Send to Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  ¡Ups! Algo salió mal
                </h1>
                <p className="text-gray-600 text-lg">
                  Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado.
                </p>
              </div>
              
              {/* Error digest (for support) */}
              {error.digest && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ID del error:</span>{' '}
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {error.digest}
                    </code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Proporciona este ID al soporte técnico para una ayuda más rápida
                  </p>
                </div>
              )}
              
              {/* Error message in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    Detalles del error (solo en desarrollo):
                  </p>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32 whitespace-pre-wrap">
                    {error.message}
                  </pre>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                        Ver stack trace
                      </summary>
                      <pre className="text-xs text-red-600 overflow-auto max-h-40 mt-2 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={reset}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  size="lg"
                >
                  <RefreshCcw className="h-5 w-5 mr-2" />
                  Intentar de nuevo
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => (window.location.href = '/')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Ir al inicio
                  </Button>
                  <Button
                    onClick={() => (window.location.href = '/soporte')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Soporte
                  </Button>
                </div>
              </div>
              
              {/* Help text */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Si este problema persiste, por favor{' '}
                  <a
                    href="/soporte"
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    contacta con soporte técnico
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

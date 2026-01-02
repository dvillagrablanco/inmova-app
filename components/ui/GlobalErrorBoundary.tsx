'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * GlobalErrorBoundary - El Centinela de Inmova
 * 
 * Captura todos los errores de React y los envía a Sentry.
 * Muestra una UI amigable al usuario en lugar de pantalla blanca.
 * 
 * @example
 * // En app/layout.tsx:
 * <GlobalErrorBoundary>
 *   <YourApp />
 * </GlobalErrorBoundary>
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar estado para mostrar UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log del error a Sentry
    console.error('🚨 [GlobalErrorBoundary] Error capturado:', error);
    console.error('📍 Component stack:', errorInfo.componentStack);

    // Enviar a Sentry con contexto adicional
    Sentry.withScope(scope => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        error: error.toString(),
      });
      Sentry.captureException(error);
    });

    // Actualizar estado local
    this.setState({
      errorInfo,
    });
  }

  handleReload = () => {
    // Limpiar estado y recargar página
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  handleGoHome = () => {
    // Ir a la home y limpiar estado
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
              ¡Ups! Algo salió mal
            </h1>

            {/* Descripción */}
            <p className="text-gray-600 text-center mb-8 text-lg">
              No te preocupes, nuestro equipo ya ha sido notificado automáticamente.
              Estamos trabajando para solucionarlo.
            </p>

            {/* Detalles técnicos (solo en desarrollo) */}
            {isDev && this.state.error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-mono text-red-800 mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-700 hover:text-red-900">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Sugerencias */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">Qué puedes hacer:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Intenta recargar la página</li>
                <li>Vuelve a la página de inicio</li>
                <li>Si el problema persiste, contacta con soporte</li>
              </ul>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReload}
                size="lg"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Recargar Página
              </Button>
              <Button
                onClick={this.handleGoHome}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <Home className="mr-2 h-5 w-5" />
                Ir a Inicio
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                ¿Necesitas ayuda urgente?{' '}
                <a
                  href="mailto:soporte@inmova.app"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Contacta con soporte
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

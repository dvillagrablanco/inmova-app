'use client';

/**
 * Error Boundary Component
 * Captura errores de React y muestra UI de fallback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to Sentry or other error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
                <p className="text-gray-600">
                  Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la
                  página.
                </p>
              </div>

              {/* Error details (only in development) */}
              {this.props.showDetails &&
                process.env.NODE_ENV === 'development' &&
                this.state.error && (
                  <div className="bg-gray-50 rounded-md p-4 text-sm">
                    <p className="font-semibold text-gray-900 mb-2">Detalles del error:</p>
                    <pre className="text-red-600 overflow-auto text-xs">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                          Component Stack
                        </summary>
                        <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="flex-1" variant="default">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1" variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>

              {/* Help text */}
              <p className="text-sm text-center text-gray-500">
                Si el problema persiste, contacta con soporte
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary con React Hook
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * HOC para envolver componentes con Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

'use client';

/**
 * Global Error Boundary
 * 
 * Componente que captura errores de React y los envía al sistema de tracking.
 * Muestra una UI de fallback amigable al usuario.
 * 
 * @usage
 * Envuelve tu aplicación o partes críticas:
 * <GlobalErrorBoundary>
 *   <YourApp />
 * </GlobalErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
  isReporting: boolean;
  reported: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReporting: false,
    reported: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Llamar callback si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Reportar al sistema de tracking
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      this.setState({ isReporting: true });
      
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          source: 'frontend',
          component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          url: typeof window !== 'undefined' ? window.location.href : '',
          metadata: {
            componentStack: errorInfo.componentStack,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          },
        }),
      });
      
      this.setState({ reported: true });
    } catch (e) {
      console.error('[ErrorBoundary] Failed to report error:', e);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reported: false,
    });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  public render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Mostrar detalles si está habilitado */}
              {this.props.showDetails && this.state.error && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-gray-500 dark:text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        Ver stack trace
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Estado del reporte */}
              {this.state.isReporting && (
                <p className="text-sm text-gray-500 text-center mb-4">
                  <Bug className="inline-block w-4 h-4 mr-1 animate-pulse" />
                  Reportando error...
                </p>
              )}
              {this.state.reported && (
                <p className="text-sm text-green-600 dark:text-green-400 text-center mb-4">
                  ✓ Error reportado al equipo de desarrollo
                </p>
              )}
            </CardContent>
            
            <CardFooter className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </Button>
              <Button 
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

/**
 * Hook para reportar errores manualmente desde componentes funcionales
 */
export function useErrorReporter() {
  const reportError = async (
    error: Error | string,
    context?: {
      component?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      const err = typeof error === 'string' ? new Error(error) : error;
      
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: err.name,
          message: err.message,
          stack: err.stack,
          source: 'frontend',
          component: context?.component,
          url: typeof window !== 'undefined' ? window.location.href : '',
          metadata: context?.metadata,
        }),
      });
    } catch (e) {
      console.error('[ErrorReporter] Failed to report error:', e);
    }
  };

  return { reportError };
}

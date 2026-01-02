'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCount: number;
}

/**
 * Enhanced Error Boundary - Solución Definitiva para Pantalla Blanca
 * 
 * Features:
 * - Captura TODOS los errores de JavaScript en el árbol de componentes
 * - UI de error garantizada (no puede fallar)
 * - Reset automático inteligente
 * - Logging detallado
 * - Prevención de loops infinitos
 * 
 * @example
 * <EnhancedErrorBoundary>
 *   <App />
 * </EnhancedErrorBoundary>
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar state para mostrar UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Incrementar contador de errores
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log detallado del error
    console.error('🔴 [EnhancedErrorBoundary] Error capturado:', {
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Callback personalizado
    this.props.onError?.(error, errorInfo);

    // Si hay demasiados errores consecutivos, forzar reload
    if (this.state.errorCount >= 5) {
      console.error('🔴 [EnhancedErrorBoundary] Demasiados errores consecutivos. Recargando página...');
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/landing';
        }, 3000);
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset automático si cambian las resetKeys
    if (this.props.resetKeys && prevProps.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );
      
      if (hasChanged && this.state.hasError) {
        this.handleReset();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/landing';
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se provee
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error garantizada (HTML puro con Tailwind, no depende de componentes)
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'linear-gradient(to bottom right, #f8fafc, #e0e7ff)',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '2rem',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                <AlertTriangle style={{ width: '1.5rem', height: '1.5rem' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                  Algo salió mal
                </h1>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                Se ha producido un error inesperado en la aplicación.
              </p>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div
                style={{
                  background: '#f3f4f6',
                  borderRadius: '0.375rem',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#374151',
                    wordBreak: 'break-all',
                    margin: 0,
                  }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount >= 3 && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '0.375rem',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                  ⚠️ Múltiples errores detectados ({this.state.errorCount}). Si el problema persiste, intenta recargar la página.
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: '1',
                  minWidth: '120px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#4338ca';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#4f46e5';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Intentar de nuevo
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  flex: '1',
                  minWidth: '120px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  background: 'white',
                  color: '#374151',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
                Ir al inicio
              </button>

              {this.state.errorCount >= 2 && (
                <button
                  onClick={this.handleReload}
                  style={{
                    flex: '1',
                    minWidth: '120px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    background: '#f59e0b',
                    color: 'white',
                    borderRadius: '0.375rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#d97706';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f59e0b';
                  }}
                >
                  <Bug style={{ width: '1rem', height: '1rem' }} />
                  Recargar página
                </button>
              )}
            </div>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ marginTop: '1.5rem' }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  Detalles técnicos
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para envolver un componente con EnhancedErrorBoundary
 */
export function withEnhancedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithEnhancedErrorBoundary(props: P) {
    return (
      <EnhancedErrorBoundary fallback={fallback}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}

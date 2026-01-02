'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
  /**
   * Nombre del widget para identificarlo en logs
   */
  widgetName?: string;
  /**
   * Mensaje personalizado para mostrar al usuario
   */
  fallbackMessage?: string;
  /**
   * Si es true, muestra un card minimalista. Si false, solo el mensaje.
   */
  showCard?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * WidgetErrorBoundary - Error Boundary Granular
 * 
 * Envuelve widgets individuales para que si uno falla, solo ese se rompa.
 * No derriba toda la página.
 * 
 * @example
 * ```tsx
 * <WidgetErrorBoundary widgetName="Actividad Reciente">
 *   <RecentActivityWidget />
 * </WidgetErrorBoundary>
 * ```
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { widgetName = 'Unknown Widget' } = this.props;

    // Log local
    console.error(`🚨 [Widget Error: ${widgetName}]`, error);

    // Enviar a Sentry con contexto del widget
    Sentry.withScope(scope => {
      scope.setContext('widget', {
        name: widgetName,
        componentStack: errorInfo.componentStack,
      });
      scope.setTag('error_boundary_type', 'widget');
      scope.setTag('widget_name', widgetName);
      scope.setLevel('warning'); // Widget errors son menos críticos que app-level
      Sentry.captureException(error);
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const {
        widgetName = 'Este componente',
        fallbackMessage,
        showCard = true,
      } = this.props;

      const message = fallbackMessage || `${widgetName} no está disponible temporalmente.`;

      // Versión minimalista (sin card)
      if (!showCard) {
        return (
          <div className="flex items-center justify-center p-4 text-center">
            <div className="text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 inline-block mr-2 text-yellow-500" />
              {message}
              <button
                onClick={this.handleReset}
                className="ml-2 text-indigo-600 hover:text-indigo-800 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        );
      }

      // Versión con card
      return (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 mb-2">{message}</p>
              <Button
                onClick={this.handleReset}
                size="sm"
                variant="outline"
                className="border-yellow-300 hover:bg-yellow-100"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Reintentar
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary de forma funcional
 * 
 * @example
 * ```tsx
 * function MyWidget() {
 *   const { ErrorBoundary } = useWidgetErrorBoundary('Mi Widget');
 *   
 *   return (
 *     <ErrorBoundary>
 *       <ComplexComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function useWidgetErrorBoundary(widgetName: string) {
  const ErrorBoundary = ({ children }: { children: React.ReactNode }) => (
    <WidgetErrorBoundary widgetName={widgetName}>{children}</WidgetErrorBoundary>
  );

  return { ErrorBoundary };
}

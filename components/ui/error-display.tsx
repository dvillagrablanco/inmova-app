/**
 * Error Display Component
 *
 * Componente para mostrar errores con contexto, acciones de retry y navegación.
 * Proporciona una experiencia de error clara y accionable para el usuario.
 *
 * @module error-display
 * @since Semana 2, Tarea 2.5
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ErrorDisplayProps {
  /** Título del error */
  title?: string;
  /** Mensaje descriptivo del error */
  message?: string;
  /** Función de retry */
  retry?: () => void;
  /** URL de retorno (ej: /dashboard) */
  returnUrl?: string;
  /** Mostrar botón de inicio */
  showHomeButton?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Tamaño del componente */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'p-4',
    icon: 'w-8 h-8',
    title: 'text-base',
    message: 'text-xs',
    button: 'h-8 text-xs',
  },
  md: {
    container: 'p-6',
    icon: 'w-12 h-12',
    title: 'text-lg',
    message: 'text-sm',
    button: 'h-10 text-sm',
  },
  lg: {
    container: 'p-8',
    icon: 'w-16 h-16',
    title: 'text-xl',
    message: 'text-base',
    button: 'h-12 text-base',
  },
};

/**
 * Componente de visualización de errores
 *
 * @example
 * ```tsx
 * // Error simple
 * <ErrorDisplay
 *   title="Error al cargar"
 *   message="No se pudieron cargar los datos"
 * />
 *
 * // Error con retry
 * <ErrorDisplay
 *   title="Error de conexión"
 *   message="No se pudo conectar al servidor"
 *   retry={() => refetch()}
 * />
 *
 * // Error con navegación
 * <ErrorDisplay
 *   title="Página no encontrada"
 *   message="La página que buscas no existe"
 *   returnUrl="/dashboard"
 *   showHomeButton
 * />
 * ```
 */
export function ErrorDisplay({
  title = 'Ha ocurrido un error',
  message = 'Lo sentimos, algo salió mal. Por favor, inténtalo de nuevo.',
  retry,
  returnUrl,
  showHomeButton = false,
  className,
  size = 'md',
}: ErrorDisplayProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!retry) return;

    setIsRetrying(true);
    try {
      await retry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReturn = () => {
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.push('/dashboard');
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn('flex w-full flex-col items-center justify-center', sizes.container, className)}
    >
      <div className="flex flex-col items-center text-center space-y-4 max-w-md">
        {/* Ícono de error */}
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className={cn('text-destructive', sizes.icon)} aria-hidden="true" />
        </div>

        {/* Título */}
        <h2 className={cn('font-semibold text-foreground', sizes.title)}>{title}</h2>

        {/* Mensaje */}
        <p className={cn('text-muted-foreground', sizes.message)}>{message}</p>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 pt-2">
          {retry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className={sizes.button}
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </>
              )}
            </Button>
          )}

          {returnUrl && (
            <Button onClick={handleReturn} variant="outline" className={sizes.button}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          )}

          {showHomeButton && (
            <Button onClick={handleHome} variant="outline" className={sizes.button}>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Variante inline del ErrorDisplay (más compacto)
 */
export function InlineErrorDisplay({
  message,
  retry,
}: Pick<ErrorDisplayProps, 'message' | 'retry'>) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      <span className="flex-1 text-destructive">{message}</span>
      {retry && (
        <Button onClick={retry} size="sm" variant="ghost" className="h-7 text-xs">
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorDisplay;

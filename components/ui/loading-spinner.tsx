/**
 * Loading Spinner Component
 *
 * Spinner consistente y reutilizable para toda la aplicación.
 * Soporta diferentes tamaños y puede mostrar texto opcional.
 *
 * @module loading-spinner
 * @since Semana 2, Tarea 2.5
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Texto opcional debajo del spinner */
  text?: string;
  /** Cubrir toda la pantalla */
  fullscreen?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * Componente de spinner de carga
 *
 * @example
 * ```tsx
 * // Spinner simple
 * <LoadingSpinner />
 *
 * // Spinner con texto
 * <LoadingSpinner size="lg" text="Cargando contratos..." />
 *
 * // Spinner de pantalla completa
 * <LoadingSpinner fullscreen text="Procesando..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  text,
  fullscreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-primary border-r-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Cargando"
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
        {text && <p className={cn('mt-4 text-muted-foreground', textSizeClasses[size])}>{text}</p>}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        {spinner}
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>{text}</p>
      </div>
    );
  }

  return spinner;
}

/**
 * Variante inline del spinner (sin margen)
 */
export function InlineSpinner({
  size = 'sm',
  className,
}: Omit<LoadingSpinnerProps, 'text' | 'fullscreen'>) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

export default LoadingSpinner;

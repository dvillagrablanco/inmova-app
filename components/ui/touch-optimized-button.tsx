'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TouchOptimizedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Botón optimizado para dispositivos táctiles
 * - Tamaño mínimo de 44x44px (recomendación iOS/Android)
 * - Feedback visual inmediato
 * - Estados de carga
 * - Accesibilidad mejorada
 */
export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl focus:ring-indigo-500',
      secondary:
        'bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-md hover:shadow-lg focus:ring-gray-400',
      outline:
        'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500',
    };

    const sizeStyles = {
      sm: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm',
      md: 'min-h-[48px] min-w-[48px] px-6 py-3 text-base',
      lg: 'min-h-[56px] min-w-[56px] px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';

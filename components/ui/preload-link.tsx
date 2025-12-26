'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useHoverPreload } from '@/lib/hooks/useRoutePreloader';
import { cn } from '@/lib/utils';

interface PreloadLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  className?: string;
  preloadDelay?: number;
  disabled?: boolean;
}

/**
 * PreloadLink - Link mejorado con precarga de rutas al hacer hover
 *
 * Características:
 * - Precarga automática de rutas al hacer hover
 * - Delay configurable para evitar precargas innecesarias
 * - Compatible con todas las props de Next.js Link
 * - Mejora la percepción de velocidad de navegación
 *
 * @example
 * ```tsx
 * <PreloadLink href="/dashboard" preloadDelay={150}>
 *   Ir al Dashboard
 * </PreloadLink>
 * ```
 */
export function PreloadLink({
  href,
  children,
  className,
  preloadDelay = 200,
  disabled = false,
  ...linkProps
}: PreloadLinkProps) {
  const hoverProps = useHoverPreload(href, { delay: preloadDelay });

  if (disabled) {
    return <span className={cn('cursor-not-allowed opacity-50', className)}>{children}</span>;
  }

  return (
    <Link href={href} className={className} {...hoverProps} {...linkProps}>
      {children}
    </Link>
  );
}

/**
 * PreloadButton - Botón con precarga de ruta integrada
 */
interface PreloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  preloadDelay?: number;
}

export function PreloadButton({
  href,
  children,
  className,
  variant = 'default',
  size = 'md',
  preloadDelay = 200,
  onClick,
  ...buttonProps
}: PreloadButtonProps) {
  const hoverProps = useHoverPreload(href, { delay: preloadDelay });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href}>
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' &&
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          size === 'sm' && 'h-9 px-3 text-sm',
          size === 'md' && 'h-10 px-4',
          size === 'lg' && 'h-11 px-8 text-lg',
          className
        )}
        onClick={handleClick}
        {...hoverProps}
        {...buttonProps}
      >
        {children}
      </button>
    </Link>
  );
}

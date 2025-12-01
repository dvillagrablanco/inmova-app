"use client";

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: string;
  className?: string;
}

/**
 * Skip Link para navegación rápida (accesibilidad)
 * Permite a usuarios de teclado saltar al contenido principal
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-50',
        'bg-primary text-primary-foreground',
        'px-4 py-2 rounded-md',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-all',
        className
      )}
    >
      {children}
    </a>
  );
}

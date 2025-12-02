import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SkipLink Component - WCAG 2.1 AA Compliant
 * Allows keyboard users to skip directly to main content
 */
export function SkipLink({ href = "#main-content", className }: { href?: string; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:absolute focus:top-0 focus:left-0 focus:z-50",
        "focus:p-4 focus:bg-primary focus:text-primary-foreground",
        "focus:font-bold focus:outline-none focus:ring-4 focus:ring-ring",
        "transition-all duration-200",
        className
      )}
    >
      Saltar al contenido principal
    </a>
  );
}

export function SkipToNavigation({ href = "#navigation" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-20 focus:z-50 focus:p-4 focus:bg-secondary focus:text-secondary-foreground focus:font-bold focus:outline-none focus:ring-4 focus:ring-ring"
    >
      Ir a la navegación
    </a>
  );
}

export function SkipToSearch({ href = "#search" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-40 focus:z-50 focus:p-4 focus:bg-accent focus:text-accent-foreground focus:font-bold focus:outline-none focus:ring-4 focus:ring-ring"
    >
      Ir al buscador
    </a>
  );
}
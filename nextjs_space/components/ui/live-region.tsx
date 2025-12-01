"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

/**
 * Live Region para anuncios a screen readers
 * Invisible pero accesible para tecnologías de asistencia
 */
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'additions',
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Alert region para mensajes urgentes
 */
export function AlertRegion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

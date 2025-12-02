import React from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

/**
 * LiveRegion Component - For screen reader announcements
 * WCAG 2.1 AA - Provides dynamic content updates to assistive technologies
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  className
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}

/**
 * Alert LiveRegion - For important, time-sensitive messages
 */
export function LiveAlert({ message, className }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}
"use client";

import { forwardRef, KeyboardEvent, HTMLAttributes } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AccessibleCardProps extends HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
}

/**
 * Card accesible con soporte completo de teclado
 */
export const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  ({ onClick, onKeyDown, role = 'button', ariaLabel, tabIndex = 0, children, className, ...props }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(e);
        return;
      }

      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <Card
        ref={ref}
        role={onClick ? role : undefined}
        tabIndex={onClick ? tabIndex : undefined}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        className={cn(
          onClick && [
            'cursor-pointer',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-ring',
            'focus-visible:ring-offset-2',
            'transition-all',
            'hover:shadow-md',
          ],
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';

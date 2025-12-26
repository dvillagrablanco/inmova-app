'use client';

import { ReactNode, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AccessibleCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  'aria-label'?: string;
  role?: string;
}

export const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  (
    { title, description, children, className, onClick, href, 'aria-label': ariaLabel, role },
    ref
  ) => {
    const isInteractive = onClick || href;

    return (
      <Card
        ref={ref}
        className={cn(
          isInteractive && 'cursor-pointer hover:shadow-lg transition-shadow',
          isInteractive && 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          className
        )}
        onClick={onClick}
        role={role || (isInteractive ? 'button' : undefined)}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';

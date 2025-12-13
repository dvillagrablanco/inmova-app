/**
 * Accessible icon button with proper ARIA labels
 * Ensures all icon-only buttons are accessible to screen readers
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface IconButtonProps extends ButtonProps {
  'aria-label': string; // Make aria-label required
  icon: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      icon,
      isLoading = false,
      loadingText,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        aria-label={isLoading && loadingText ? loadingText : ariaLabel}
        disabled={disabled || isLoading}
        className={cn('relative', className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">{icon}</span>
        )}
        {children && <span className="ml-2">{children}</span>}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

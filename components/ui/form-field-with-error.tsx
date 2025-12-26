'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input, InputProps } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface FormFieldWithErrorProps extends InputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormFieldWithError = React.forwardRef<HTMLInputElement, FormFieldWithErrorProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="flex items-center gap-1">
          {label}
          {required && (
            <span className="text-destructive" aria-label="obligatorio">
              *
            </span>
          )}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-required={required}
          className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

FormFieldWithError.displayName = 'FormFieldWithError';

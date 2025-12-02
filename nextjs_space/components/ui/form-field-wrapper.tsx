'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormFieldWrapperProps {
  children: ReactNode;
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  tooltip?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export function FormFieldWrapper({
  children,
  label,
  htmlFor,
  error,
  hint,
  tooltip,
  required,
  optional,
  className,
}: FormFieldWrapperProps) {
  const fieldId = htmlFor || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor={fieldId} className="flex items-center gap-1">
              {label}
              {required && (
                <span className="text-destructive" aria-label="requerido">
                  *
                </span>
              )}
            </Label>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          {optional && (
            <span className="text-xs text-muted-foreground">(Opcional)</span>
          )}
        </div>
      )}
      
      <div
        {...(errorId && { 'aria-describedby': errorId })}
        {...(hintId && !error && { 'aria-describedby': hintId })}
      >
        {children}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-xs text-destructive flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
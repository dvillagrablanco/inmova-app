import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface AccessibleFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  showRequiredIndicator?: boolean;
}

/**
 * Componente de campo de formulario completamente accesible
 * - ARIA labels y descriptions
 * - Focus indicators claros
 * - Mensajes de error user-friendly
 * - Soporte para íconos
 * - Indicador de campo requerido
 */
export const AccessibleFormField = forwardRef<HTMLInputElement, AccessibleFormFieldProps>(
  ({ label, error, hint, icon, showRequiredIndicator, className, id, required, ...props }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    const hasError = Boolean(error);
    const isRequired = required || showRequiredIndicator;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={fieldId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
        >
          {label}
          {isRequired && (
            <span className="text-red-500" aria-label="campo requerido">
              *
            </span>
          )}
        </Label>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
          )}

          <Input
            ref={ref}
            id={fieldId}
            required={required}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={cn(hint && !error ? hintId : undefined, error ? errorId : undefined)}
            className={cn(
              icon && 'pl-10',
              hasError && 'border-red-500 focus:ring-red-500',
              'transition-colors duration-200',
              // Focus indicator mejorado
              'focus:ring-4 focus:ring-primary/20 focus:border-primary',
              className
            )}
            {...props}
          />

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleFormField.displayName = 'AccessibleFormField';

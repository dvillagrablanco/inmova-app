import { forwardRef, ReactNode } from 'react'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AccessibleSelectFieldProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  showRequiredIndicator?: boolean
  className?: string
}

/**
 * Componente de select completamente accesible
 * - ARIA labels y descriptions
 * - Focus indicators claros  
 * - Mensajes de error user-friendly
 * - Indicador de campo requerido
 */
export const AccessibleSelectField = forwardRef<HTMLButtonElement, AccessibleSelectFieldProps>(
  ({ 
    label, 
    value, 
    onValueChange, 
    options, 
    error, 
    hint, 
    placeholder = 'Seleccionar...', 
    disabled,
    required,
    showRequiredIndicator,
    className 
  }, ref) => {
    const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    
    const hasError = Boolean(error)
    const isRequired = required || showRequiredIndicator

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
          <p 
            id={hintId} 
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
        
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            id={fieldId}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={cn(
              hint && !error ? hintId : undefined,
              error ? errorId : undefined
            )}
            className={cn(
              hasError && 'border-red-500 focus:ring-red-500',
              'transition-colors duration-200',
              // Focus indicator mejorado
              'focus:ring-4 focus:ring-primary/20 focus:border-primary',
              className
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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
    )
  }
)

AccessibleSelectField.displayName = 'AccessibleSelectField'
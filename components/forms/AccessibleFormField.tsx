/**
 * Componente de campo de formulario accesible
 * Proporciona estructura consistente y accesibilidad WCAG 2.1 AA
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  tooltip?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date';
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

/**
 * Campo de texto accesible con validación
 */
export function AccessibleInputField({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  helpText,
  tooltip,
  className,
  min,
  max,
  step,
}: InputFieldProps) {
  const hasError = !!error;
  const describedBy = `${id}-error ${id}-help`.trim();
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="font-medium">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requerido">
              *
            </span>
          )}
        </Label>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>

      <div className="relative">
        <Input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError || helpText ? describedBy : undefined}
          aria-required={required}
          min={min}
          max={max}
          step={step}
          className={cn(
            hasError && 'border-red-500 focus-visible:ring-red-500',
            isPasswordField && 'pr-12',
            'transition-colors'
          )}
        />
        {isPasswordField && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}

      {hasError && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Campo de área de texto accesible
 */
export function AccessibleTextareaField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  helpText,
  tooltip,
  className,
  rows = 4,
}: TextareaFieldProps) {
  const hasError = !!error;
  const describedBy = `${id}-error ${id}-help`.trim();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="font-medium">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requerido">
              *
            </span>
          )}
        </Label>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>

      <Textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={hasError || helpText ? describedBy : undefined}
        aria-required={required}
        className={cn(
          hasError && 'border-red-500 focus-visible:ring-red-500',
          'transition-colors'
        )}
      />

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}

      {hasError && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Campo de selección accesible
 */
export function AccessibleSelectField({
  id,
  name,
  label,
  placeholder = 'Seleccione una opción',
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  helpText,
  tooltip,
  className,
}: SelectFieldProps) {
  const hasError = !!error;
  const describedBy = `${id}-error ${id}-help`.trim();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="font-medium">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requerido">
              *
            </span>
          )}
        </Label>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          aria-invalid={hasError}
          aria-describedby={hasError || helpText ? describedBy : undefined}
          aria-required={required}
          className={cn(
            hasError && 'border-red-500 focus-visible:ring-red-500',
            'transition-colors'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}

      {hasError && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

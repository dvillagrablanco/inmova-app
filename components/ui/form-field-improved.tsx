'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  showCharCount?: boolean;
  icon?: ReactNode;
}

export function FormFieldImproved({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  hint,
  required = false,
  disabled = false,
  placeholder,
  className,
  rows = 4,
  min,
  max,
  step,
  maxLength,
  pattern,
  autoComplete,
  showCharCount = false,
  icon,
}: FormFieldProps) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;
  const charCount = String(value).length;
  const showCount = showCharCount && maxLength;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label
        htmlFor={name}
        className={cn(
          'text-sm font-medium',
          hasError && 'text-destructive',
          hasSuccess && 'text-green-600'
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Input Container */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input or Textarea */}
        {type === 'textarea' ? (
          <Textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              icon && 'pl-10',
              hasError && 'border-destructive focus-visible:ring-destructive',
              hasSuccess && 'border-green-500 focus-visible:ring-green-500'
            )}
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            pattern={pattern}
            autoComplete={autoComplete}
            className={cn(
              icon && 'pl-10',
              hasError && 'border-destructive focus-visible:ring-destructive',
              hasSuccess && 'border-green-500 focus-visible:ring-green-500'
            )}
          />
        )}

        {/* Success/Error Icon */}
        {(hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {hasSuccess && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
        )}
      </div>

      {/* Character Count */}
      {showCount && (
        <div className="flex justify-end">
          <span
            className={cn(
              'text-xs',
              charCount > maxLength! ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {charCount} / {maxLength}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-1">
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="flex items-start gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {hint && !error && !success && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

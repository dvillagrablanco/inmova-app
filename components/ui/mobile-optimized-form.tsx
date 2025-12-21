'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Componente de formulario optimizado para móvil
 * Mejora la experiencia en pantallas pequeñas
 */

interface MobileOptimizedFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  submitDisabled?: boolean;
}

export function MobileOptimizedForm({
  children,
  onSubmit,
  title,
  description,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  loading = false,
  className,
  submitDisabled = false,
}: MobileOptimizedFormProps) {
  const isMobile = useIsMobile();

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex flex-col', isMobile ? 'h-full' : '', className)}
    >
      {/* Header (si hay título) */}
      {title && (
        <div className={cn('mb-6', isMobile && 'px-4 pt-4')}>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Contenido del formulario */}
      <div
        className={cn(
          'flex-1',
          isMobile
            ? 'overflow-y-auto px-4 pb-24' // Espacio para botones fijos
            : 'space-y-6'
        )}
      >
        {/* En móvil, cada grupo de campos en una card */}
        {isMobile ? (
          <div className="space-y-4">{children}</div>
        ) : (
          <Card className="p-6">{children}</Card>
        )}
      </div>

      {/* Botones de acción */}
      <div
        className={cn(
          'flex gap-3',
          isMobile
            ? 'fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg'
            : 'mt-6 justify-end'
        )}
      >
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className={cn(isMobile && 'flex-1')}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || submitDisabled}
          className={cn(isMobile && 'flex-1')}
        >
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * FormSection: Agrupa campos relacionados con un encabezado
 * Optimizado para mobile con mejor espaciado
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn('border-b pb-3', isMobile && 'border-muted')}>
        <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn('space-y-4', isMobile && 'space-y-3')}>{children}</div>
    </div>
  );
}

/**
 * FormField: Wrapper para campos individuales con mejor UX en móvil
 */
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
          'block font-medium',
          isMobile ? 'text-sm' : 'text-sm',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

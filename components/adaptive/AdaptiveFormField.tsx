'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IntelligentTooltip } from './IntelligentTooltip';
import { UserProfile, shouldShowAdvancedFields } from '@/lib/ui-mode-service';
import { cn } from '@/lib/utils';

interface AdaptiveFormFieldProps {
  /**
   * Nombre del campo
   */
  name: string;

  /**
   * Label visible
   */
  label: string;

  /**
   * Tipo de campo
   */
  type?: 'text' | 'email' | 'number' | 'tel' | 'textarea' | 'select' | 'date';

  /**
   * Si es obligatorio
   */
  required?: boolean;

  /**
   * Nivel de complejidad
   */
  complexity?: 'low' | 'medium' | 'high';

  /**
   * Texto de ayuda
   */
  helpText?: string;

  /**
   * Opciones (para select)
   */
  options?: Array<{ value: string; label: string }>;

  /**
   * Valor actual
   */
  value?: string;

  /**
   * Callback onChange
   */
  onChange?: (value: string) => void;

  /**
   * Perfil del usuario
   */
  userProfile: UserProfile;

  /**
   * Placeholder
   */
  placeholder?: string;

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * ADAPTIVE FORM FIELD - Campo de formulario que se adapta al modo UI
 *
 * Comportamiento:
 * - Simple Mode: Solo campos obligatorios o de baja complejidad
 * - Standard Mode: Obligatorios + baja y media complejidad
 * - Advanced Mode: Todos los campos
 *
 * Features:
 * - Tooltips de ayuda para principiantes
 * - Validación visual automática
 * - Etiquetas de "Avanzado" en campos complejos
 */
export function AdaptiveFormField({
  name,
  label,
  type = 'text',
  required = false,
  complexity = 'low',
  helpText,
  options,
  value,
  onChange,
  userProfile,
  placeholder,
  className,
}: AdaptiveFormFieldProps) {
  // Determinar si el campo debe ser visible
  const shouldShow = () => {
    if (required) return true;

    if (userProfile.uiMode === 'simple') {
      return complexity === 'low';
    }

    if (userProfile.uiMode === 'standard') {
      return complexity !== 'high';
    }

    // Advanced mode: mostrar todo
    return true;
  };

  if (!shouldShow()) {
    return null;
  }

  const showAdvancedBadge = complexity === 'high' && userProfile.uiMode === 'advanced';
  const showTooltips =
    userProfile.experienceLevel === 'principiante' || userProfile.techSavviness === 'bajo';

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={cn('min-h-[100px]', className)}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder || `Selecciona ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={className}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Label con tooltip opcional */}
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="flex items-center gap-2">
          {label}
          {required && <span className="text-red-500">*</span>}
          {showAdvancedBadge && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              Avanzado
            </span>
          )}
        </Label>

        {showTooltips && helpText && (
          <IntelligentTooltip
            content={helpText}
            variant="tip"
            side="right"
            dismissible
            tooltipId={`field-${name}`}
            showIcon
          />
        )}
      </div>

      {/* Input */}
      {renderInput()}

      {/* Texto de ayuda (solo si no hay tooltip) */}
      {!showTooltips && helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}

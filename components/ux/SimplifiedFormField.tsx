'use client';

/**
 * Campos de Formulario Simplificados
 * 
 * Reducen fricción para usuarios no técnicos:
 * - Labels claros sin jerga
 * - Placeholders con ejemplos reales
 * - Validación visual inmediata
 * - Tooltips contextuales
 * - Auto-complete inteligente
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { ContextualTooltip } from './ContextualTooltip';

interface SimplifiedFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  tooltipContent?: string;
  options?: Array<{ value: string; label: string }>; // Para selects
  validate?: (value: string) => boolean | string; // Validación custom
  autoComplete?: string;
}

export function SimplifiedFormField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  helpText,
  tooltipContent,
  options,
  validate,
  autoComplete,
}: SimplifiedFormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setTouched(true);
    if (required && !value) {
      setError('Este campo es obligatorio');
      return;
    }

    if (validate) {
      const result = validate(value);
      if (result === true) {
        setError(null);
      } else if (typeof result === 'string') {
        setError(result);
      }
    } else {
      setError(null);
    }
  };

  const isValid = touched && !error && value;
  const hasError = touched && error;

  const LabelWithTooltip = () => (
    <div className="flex items-center gap-2 mb-2">
      <Label htmlFor={id} className="text-base font-semibold text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {tooltipContent && (
        <ContextualTooltip
          id={`field_${id}`}
          title={label}
          content={tooltipContent}
          type="tip"
        >
          <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
        </ContextualTooltip>
      )}
    </div>
  );

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        <LabelWithTooltip />
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={`w-full ${hasError ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}>
            <SelectValue placeholder={placeholder || 'Selecciona una opción'} />
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
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
        {hasError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {isValid && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Correcto</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-1">
        <LabelWithTooltip />
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={`${hasError ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}
          rows={4}
        />
        {helpText && !hasError && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
        {hasError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {isValid && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Correcto</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <LabelWithTooltip />
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`${hasError ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}
        autoComplete={autoComplete}
        required={required}
      />
      {helpText && !hasError && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
      {hasError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Correcto</span>
        </div>
      )}
    </div>
  );
}

/**
 * Formulario Multi-Step Simplificado
 */

interface SimplifiedMultiStepFormProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    fields: React.ReactNode;
  }>;
  onComplete: (data: any) => void;
  onCancel?: () => void;
}

export function SimplifiedMultiStepForm({
  steps,
  onComplete,
  onCancel,
}: SimplifiedMultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Paso {currentStep + 1} de {steps.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>
        
        <div className="space-y-4">
          {currentStepData.fields}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Atrás
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700"
        >
          {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? 'w-8 bg-blue-600'
                : index < currentStep
                ? 'w-2 bg-green-500'
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

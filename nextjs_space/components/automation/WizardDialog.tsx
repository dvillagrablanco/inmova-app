'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WizardStep } from '@/lib/wizard-config';

interface WizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: WizardStep[];
  onComplete: (data: any) => Promise<void>;
}

export function WizardDialog({
  open,
  onOpenChange,
  title,
  description,
  steps,
  onComplete,
}: WizardDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const validateCurrentStep = (): boolean => {
    const step = currentStep;

    // Validar campos requeridos
    for (const field of step.fields) {
      if (field.required && !formData[field.name]) {
        toast.error(`El campo "${field.label}" es obligatorio`);
        return false;
      }

      // Validación personalizada del campo
      if (field.validation && formData[field.name]) {
        const error = field.validation(formData[field.name]);
        if (error) {
          toast.error(error);
          return false;
        }
      }
    }

    // Validación personalizada del paso
    if (step.validation) {
      const error = step.validation(formData);
      if (error) {
        toast.error(error);
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    // Auto-fill siguiente paso si aplica
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep.autoFill) {
        const autoFilledData = nextStep.autoFill(formData);
        setFormData(prev => ({ ...prev, ...autoFilledData }));
      }
    }

    if (isLastStep) {
      // Último paso: completar wizard
      setIsSubmitting(true);
      try {
        await onComplete(formData);
        toast.success('¡Completado exitosamente!');
        onOpenChange(false);
        // Reset
        setCurrentStepIndex(0);
        setFormData({});
      } catch (error: any) {
        toast.error(error.message || 'Error al completar');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={val => handleFieldChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Selecciona una opción'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option: any) => {
              const isSelected = Array.isArray(value) && value.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={isSelected}
                    onCheckedChange={checked => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        handleFieldChange(field.name, [...currentValues, option.value]);
                      } else {
                        handleFieldChange(
                          field.name,
                          currentValues.filter((v: string) => v !== option.value)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={checked => handleFieldChange(field.name, checked)}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {field.label}
            </label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={e => handleFieldChange(field.name, e.target.files?.[0])}
            required={field.required}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Paso {currentStepIndex + 1} de {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Title & Description */}
          <div>
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {currentStep.fields.map(field => (
              <div key={field.name} className="space-y-2">
                {field.type !== 'checkbox' && (
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                )}
                {renderField(field)}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="gradient-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Completar
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

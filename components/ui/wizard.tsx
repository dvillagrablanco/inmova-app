'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, Save, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  fields: ReactNode | ((data: any) => ReactNode);
  optional?: boolean;
  validate?: (data: any) => Promise<boolean | string>; // true = valid, false/string = error
  onEnter?: (data: any) => Promise<void>;
  onExit?: (data: any) => Promise<void>;
  shouldSkip?: (data: any) => boolean;
  helpText?: string;
  videoUrl?: string;
}

interface WizardProps {
  steps: WizardStep[];
  title?: string;
  description?: string;
  initialData?: any;
  onComplete: (data: any) => Promise<void>;
  onSave?: (data: any) => Promise<void>;
  onCancel?: () => void;
  enableAutoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  showPreview?: boolean;
  previewComponent?: (data: any) => ReactNode;
  className?: string;
}

export function Wizard({
  steps,
  title,
  description,
  initialData = {},
  onComplete,
  onSave,
  onCancel,
  enableAutoSave = false,
  autoSaveInterval = 30000,
  showPreview = true,
  previewComponent,
  className,
}: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Filter out steps that should be skipped
  const visibleSteps = steps.filter((step, index) => {
    return !step.shouldSkip || !step.shouldSkip(formData);
  });

  const currentStep = visibleSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / visibleSteps.length) * 100;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !onSave) return;

    const interval = setInterval(async () => {
      try {
        await onSave(formData);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [enableAutoSave, onSave, formData, autoSaveInterval]);

  // Call onEnter when step changes
  useEffect(() => {
    const executeOnEnter = async () => {
      if (currentStep.onEnter) {
        try {
          await currentStep.onEnter(formData);
        } catch (error) {
          console.error('onEnter failed:', error);
        }
      }
    };
    executeOnEnter();
  }, [currentStepIndex]);

  const updateFormData = useCallback((updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  }, []);

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!currentStep.validate) return true;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await currentStep.validate(formData);

      if (result === true) {
        return true;
      } else if (typeof result === 'string') {
        setValidationError(result);
        return false;
      } else {
        setValidationError('Por favor, completa todos los campos requeridos.');
        return false;
      }
    } catch (error) {
      setValidationError('Error al validar el formulario.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    // Validate current step
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    // Call onExit
    if (currentStep.onExit) {
      try {
        await currentStep.onExit(formData);
      } catch (error) {
        console.error('onExit failed:', error);
        toast.error('Error al procesar el paso');
        return;
      }
    }

    // If last step, complete
    if (isLastStep) {
      await handleComplete();
      return;
    }

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setVisitedSteps((prev) => new Set(prev).add(nextIndex));
    setValidationError(null);
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    setCurrentStepIndex((prev) => prev - 1);
    setValidationError(null);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      toast.success('¡Completado con éxito!');
    } catch (error) {
      console.error('Wizard completion failed:', error);
      toast.error('Error al completar el asistente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      await onSave(formData);
      setLastSaved(new Date());
      toast.success('Progreso guardado');
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const goToStep = (index: number) => {
    // Only allow navigation to visited steps
    if (visitedSteps.has(index)) {
      setCurrentStepIndex(index);
      setValidationError(null);
    }
  };

  const togglePreview = () => {
    setIsPreviewMode((prev) => !prev);
  };

  return (
    <div className={cn('mx-auto w-full', className)}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-6 text-center">
          {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Paso {currentStepIndex + 1} de {visibleSteps.length}
          </span>
          <div className="flex items-center gap-2">
            {enableAutoSave && lastSaved && (
              <span className="text-xs text-muted-foreground">
                Guardado {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="mb-6 flex justify-center gap-2">
        {visibleSteps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isVisited = visitedSteps.has(index);

          return (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              disabled={!isVisited}
              className={cn(
                'relative h-10 w-10 rounded-full border-2 transition-all',
                isActive && 'border-primary bg-primary text-white scale-110',
                isCompleted && 'border-primary bg-primary text-white',
                !isActive &&
                  !isCompleted &&
                  isVisited &&
                  'border-primary/30 hover:border-primary/50',
                !isVisited && 'border-gray-300 opacity-50 cursor-not-allowed'
              )}
              title={step.title}
            >
              {isCompleted ? (
                <Check className="h-5 w-5 mx-auto" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
              {step.optional && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  ?
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Preview Mode */}
      {isPreviewMode && showPreview && (
        <Card className="mb-6 border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Previa
            </CardTitle>
            <CardDescription>Revisa tu información antes de continuar</CardDescription>
          </CardHeader>
          <CardContent>
            {previewComponent ? (
              previewComponent(formData)
            ) : (
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(formData, null, 2)}
              </pre>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={togglePreview} variant="outline" className="w-full">
              Volver al Formulario
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Main Wizard Card */}
      {!isPreviewMode && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {currentStep.icon && <div className="text-primary">{currentStep.icon}</div>}
                      <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                      {currentStep.optional && (
                        <Badge variant="secondary" className="ml-2">
                          Opcional
                        </Badge>
                      )}
                    </div>
                    {currentStep.description && (
                      <CardDescription className="text-base">
                        {currentStep.description}
                      </CardDescription>
                    )}
                  </div>
                  {currentStep.videoUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={currentStep.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Tutorial
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Help Text */}
                {currentStep.helpText && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{currentStep.helpText}</AlertDescription>
                  </Alert>
                )}

                {/* Validation Error */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Step Fields */}
                {typeof currentStep.fields === 'function'
                  ? currentStep.fields({ data: formData, updateData: updateFormData })
                  : currentStep.fields}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-6">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isFirstStep || isSubmitting}
                    className="touch-manipulation"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  {onSave && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {showPreview && !isLastStep && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={togglePreview}
                      disabled={isSubmitting}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  )}

                  {currentStep.optional && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleNext}
                      disabled={isSubmitting || isValidating}
                    >
                      Saltar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting || isValidating}
                    className="touch-manipulation"
                  >
                    {isSubmitting ? (
                      'Procesando...'
                    ) : isLastStep ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Finalizar
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

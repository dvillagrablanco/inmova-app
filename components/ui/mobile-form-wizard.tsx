'use client';

import { useState, useEffect, ReactNode } from 'react';
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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: ReactNode;
}

interface MobileFormWizardProps {
  steps: FormStep[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  enableOnMobile?: boolean;
  mobileBreakpoint?: number;
  submitButton?: ReactNode;
}

export function MobileFormWizard({
  steps = [],
  currentStep: externalCurrentStep,
  onStepChange,
  onComplete,
  enableOnMobile = true,
  mobileBreakpoint = 768,
  submitButton,
}: MobileFormWizardProps) {
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const currentStep = externalCurrentStep !== undefined ? externalCurrentStep : internalCurrentStep;
  const setCurrentStep = onStepChange || setInternalCurrentStep;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Si no está en móvil o no está habilitado para móvil, renderizar todos los pasos
  if (!enableOnMobile || !isMobile) {
    return (
      <div className="space-y-6">
        {steps.map((step) => (
          <Card key={step.id}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              {step.description && <CardDescription>{step.description}</CardDescription>}
            </CardHeader>
            <CardContent>{step.fields}</CardContent>
          </Card>
        ))}
        {submitButton && <div className="flex justify-end">{submitButton}</div>}
      </div>
    );
  }

  // Vista de wizard para móvil
  // Validación: asegurar que currentStep esté en rango
  if (steps.length === 0 || currentStep >= steps.length || currentStep < 0) {
    return <div className="p-4 text-center text-muted-foreground">No hay pasos disponibles</div>;
  }

  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const step = steps[currentStep];

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Paso {currentStep + 1} de {totalSteps}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators (dots) */}
      <div className="flex justify-center gap-2 py-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? 'w-8 bg-primary'
                : index < currentStep
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-gray-300'
            }`}
            aria-label={`Ir al paso ${index + 1}`}
          />
        ))}
      </div>

      {/* Current step card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{step.title}</CardTitle>
          {step.description && (
            <CardDescription className="text-sm">{step.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">{step.fields}</CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="w-full sm:w-auto touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto touch-manipulation"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            submitButton || (
              <Button
                type="submit"
                onClick={handleNext}
                className="w-full sm:w-auto touch-manipulation"
              >
                <Check className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            )
          )}
        </CardFooter>
      </Card>

      {/* Navigation hints */}
      <div className="text-center text-xs text-muted-foreground">
        Puedes usar los puntos arriba para navegar entre pasos
      </div>
    </div>
  );
}

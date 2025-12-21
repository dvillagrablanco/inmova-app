"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardState } from '@/lib/hooks/useWizard';

interface WizardContainerProps {
  /**
   * Estado del wizard
   */
  state: WizardState;

  /**
   * Título del wizard
   */
  title: string;

  /**
   * Descripción
   */
  description?: string;

  /**
   * Si el paso actual es válido
   */
  isStepValid?: boolean;

  /**
   * Si está guardando/enviando
   */
  isSubmitting?: boolean;

  /**
   * Callbacks
   */
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;

  /**
   * Children (contenido del paso actual)
   */
  children: React.ReactNode;

  /**
   * Mostrar indicador de pasos
   */
  showStepIndicator?: boolean;
}

/**
 * WIZARD CONTAINER - Contenedor base para wizards
 * 
 * Características:
 * - Barra de progreso visual
 * - Indicadores de pasos
 * - Navegación automática (Anterior/Siguiente)
 * - Animaciones entre pasos
 * - Responsive design
 */
export function WizardContainer({
  state,
  title,
  description,
  isStepValid = true,
  isSubmitting = false,
  onNext,
  onPrevious,
  onComplete,
  children,
  showStepIndicator = true,
}: WizardContainerProps) {
  const { currentStep, currentStepIndex, totalSteps, isFirstStep, isLastStep, progress } = state;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Paso {currentStepIndex + 1} de {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {state.completedSteps && Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = state.completedSteps.has(index);
            const isCurrent = index === currentStepIndex;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      isCompleted && !isCurrent && 'bg-green-500 text-white',
                      !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[80px] hidden md:block">
                    {/* Nombre del paso */}
                  </span>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 transition-all',
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          {currentStep.description && (
            <CardDescription>{currentStep.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep.isOptional && !isLastStep && (
          <Button
            variant="ghost"
            onClick={onNext}
            disabled={isSubmitting}
          >
            Saltar paso
          </Button>
        )}

        {isLastStep ? (
          <Button
            onClick={onComplete}
            disabled={!isStepValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finalizar
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!isStepValid || isSubmitting}
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

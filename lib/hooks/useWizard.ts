import { useState, useCallback, useEffect } from 'react';

import logger from '@/lib/logger';
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isValid?: boolean;
  isOptional?: boolean;
}

export interface WizardConfig {
  steps: WizardStep[];
  persistKey?: string; // Key para localStorage
  onComplete?: (data: any) => void | Promise<void>;
}

export interface WizardState {
  currentStepIndex: number;
  currentStep: WizardStep;
  totalSteps: number;
  completedSteps: Set<number>;
  data: Record<string, any>;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
}

/**
 * Hook principal para gestionar wizards
 */
export function useWizard(config: WizardConfig) {
  const { steps, persistKey, onComplete } = config;

  // Estado del wizard
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [data, setData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restaurar progreso de localStorage si existe
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`wizard-${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentStepIndex(parsed.currentStepIndex || 0);
          setCompletedSteps(new Set(parsed.completedSteps || []));
          setData(parsed.data || {});
        } catch (e) {
          logger.error('Error al restaurar wizard:', e);
        }
      }
    }
  }, [persistKey]);

  // Guardar progreso en localStorage
  const saveProgress = useCallback(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(
        `wizard-${persistKey}`,
        JSON.stringify({
          currentStepIndex,
          completedSteps: Array.from(completedSteps),
          data,
        })
      );
    }
  }, [persistKey, currentStepIndex, completedSteps, data]);

  // Guardar cada vez que cambie el estado
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Navegar al siguiente paso
  const goToNext = useCallback(() => {
    if (!isLastStep) {
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, isLastStep]);

  // Navegar al paso anterior
  const goToPrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  // Saltar al paso específico
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStepIndex(stepIndex);
      }
    },
    [steps.length]
  );

  // Actualizar datos del wizard
  const updateData = useCallback((stepId: string, stepData: any) => {
    setData((prev) => ({
      ...prev,
      [stepId]: stepData,
    }));
  }, []);

  // Resetear wizard
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setData({});
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(`wizard-${persistKey}`);
    }
  }, [persistKey]);

  // Completar wizard
  const complete = useCallback(async () => {
    if (onComplete) {
      setIsSubmitting(true);
      try {
        await onComplete(data);
        reset();
      } catch (error) {
        logger.error('Error al completar wizard:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [data, onComplete, reset]);

  const state: WizardState = {
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    completedSteps,
    data,
    isFirstStep,
    isLastStep,
    progress,
  };

  return {
    state,
    actions: {
      goToNext,
      goToPrevious,
      goToStep,
      updateData,
      reset,
      complete,
    },
    isSubmitting,
  };
}

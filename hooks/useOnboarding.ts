/**
 * Hook para gestionar el estado del onboarding
 * Persiste en localStorage para cada usuario
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type OnboardingStep =
  | 'welcome'
  | 'create-property'
  | 'upload-photos'
  | 'add-tenant'
  | 'generate-contract'
  | 'dashboard-overview'
  | 'completed';

interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  hasSeenOnboarding: boolean;
}

const STORAGE_KEY = 'inmova-onboarding';

export function useOnboarding() {
  const { data: session } = useSession();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'welcome',
    completedSteps: [],
    hasSeenOnboarding: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estado del localStorage
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const key = `${STORAGE_KEY}-${session.user.id}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.error('[Onboarding] Error loading state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Persistir estado en localStorage
  const persistState = (newState: OnboardingState) => {
    if (!session?.user?.id) return;

    try {
      const key = `${STORAGE_KEY}-${session.user.id}`;
      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('[Onboarding] Error saving state:', error);
    }
  };

  // Marcar paso como completado
  const completeStep = (step: OnboardingStep) => {
    const newCompletedSteps = [...state.completedSteps, step];
    persistState({
      ...state,
      completedSteps: newCompletedSteps,
    });
  };

  // Ir al siguiente paso
  const nextStep = (step: OnboardingStep) => {
    persistState({
      ...state,
      currentStep: step,
    });
  };

  // Marcar onboarding como visto
  const markOnboardingAsSeen = () => {
    persistState({
      ...state,
      hasSeenOnboarding: true,
      currentStep: 'completed',
    });
  };

  // Reiniciar onboarding (útil para testing o si usuario quiere verlo de nuevo)
  const resetOnboarding = () => {
    persistState({
      currentStep: 'welcome',
      completedSteps: [],
      hasSeenOnboarding: false,
    });
  };

  // Verificar si el onboarding debe mostrarse
  const shouldShowOnboarding = !isLoading && !state.hasSeenOnboarding && !!session?.user;

  return {
    ...state,
    isLoading,
    shouldShowOnboarding,
    completeStep,
    nextStep,
    markOnboardingAsSeen,
    resetOnboarding,
  };
}

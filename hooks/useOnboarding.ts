/**
 * Hook para gestionar el estado del onboarding
 * Persiste en localStorage para cada usuario
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

// Leer directamente de localStorage (usado para verificación inmediata)
function readOnboardingState(userId: string): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${STORAGE_KEY}-${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Onboarding] Error reading state:', error);
  }
  return null;
}

// Escribir directamente a localStorage (usado para persistencia inmediata)
function writeOnboardingState(userId: string, state: OnboardingState): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const key = `${STORAGE_KEY}-${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('[Onboarding] Error writing state:', error);
    return false;
  }
}

export function useOnboarding() {
  const { data: session } = useSession();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'welcome',
    completedSteps: [],
    hasSeenOnboarding: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref para evitar que se muestre el onboarding si ya se marcó como visto
  const hasMarkedAsSeen = useRef(false);

  // Cargar estado del localStorage
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const storedState = readOnboardingState(session.user.id);
    if (storedState) {
      setState(storedState);
      // Si ya está marcado como visto, actualizar el ref
      if (storedState.hasSeenOnboarding) {
        hasMarkedAsSeen.current = true;
      }
    }
    
    setIsLoading(false);
  }, [session?.user?.id]);

  // Persistir estado en localStorage - memoizado para evitar re-renders
  const persistState = useCallback((newState: OnboardingState) => {
    if (!session?.user?.id) return;

    const success = writeOnboardingState(session.user.id, newState);
    if (success) {
      setState(newState);
    }
  }, [session?.user?.id]);

  // Marcar paso como completado
  const completeStep = useCallback((step: OnboardingStep) => {
    setState(currentState => {
      const newCompletedSteps = Array.isArray(currentState.completedSteps)
        ? [...currentState.completedSteps, step]
        : [step];
      const newState = {
        ...currentState,
        completedSteps: newCompletedSteps,
      };
      if (session?.user?.id) {
        writeOnboardingState(session.user.id, newState);
      }
      return newState;
    });
  }, [session?.user?.id]);

  // Ir al siguiente paso
  const nextStep = useCallback((step: OnboardingStep) => {
    setState(currentState => {
      const newState = {
        ...currentState,
        currentStep: step,
      };
      if (session?.user?.id) {
        writeOnboardingState(session.user.id, newState);
      }
      return newState;
    });
  }, [session?.user?.id]);

  // Marcar onboarding como visto - con persistencia INMEDIATA
  const markOnboardingAsSeen = useCallback(() => {
    // Marcar el ref inmediatamente para evitar que se muestre de nuevo
    hasMarkedAsSeen.current = true;
    
    const newState: OnboardingState = {
      currentStep: 'completed',
      completedSteps: Array.isArray(state.completedSteps) ? state.completedSteps : [],
      hasSeenOnboarding: true,
    };
    
    // Persistir INMEDIATAMENTE
    if (session?.user?.id) {
      writeOnboardingState(session.user.id, newState);
    }
    
    setState(newState);
    
    console.log('[Onboarding] Marked as seen for user:', session?.user?.id);
  }, [session?.user?.id, state.completedSteps]);

  // Reiniciar onboarding (útil para testing o si usuario quiere verlo de nuevo)
  const resetOnboarding = useCallback(() => {
    hasMarkedAsSeen.current = false;
    const newState: OnboardingState = {
      currentStep: 'welcome',
      completedSteps: [],
      hasSeenOnboarding: false,
    };
    if (session?.user?.id) {
      writeOnboardingState(session.user.id, newState);
    }
    setState(newState);
  }, [session?.user?.id]);

  // Verificar si el onboarding debe mostrarse
  // IMPORTANTE: También verificamos el ref para evitar mostrar si ya se marcó como visto en esta sesión
  const shouldShowOnboarding = !isLoading && 
    !state.hasSeenOnboarding && 
    !hasMarkedAsSeen.current &&
    !!session?.user;

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

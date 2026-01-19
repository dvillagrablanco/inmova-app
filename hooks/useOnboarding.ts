/**
 * Hook para gestionar el estado del onboarding
 * Persiste en localStorage para cada usuario
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const { data: session, status } = useSession();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'welcome',
    completedSteps: [],
    hasSeenOnboarding: true, // Default a TRUE para evitar flash del tour
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs para evitar race conditions
  const hasLoadedRef = useRef(false);
  const markedAsSeenRef = useRef(false);

  // ID del usuario para persistencia
  const userId = (session?.user as any)?.id;

  // Cargar estado del localStorage
  useEffect(() => {
    // Esperar a que la sesión esté lista (no 'loading')
    if (status === 'loading') {
      return;
    }

    // Si no hay usuario autenticado, no mostrar onboarding
    if (status === 'unauthenticated' || !userId) {
      setIsLoading(false);
      return;
    }

    // Evitar múltiples cargas
    if (hasLoadedRef.current) {
      return;
    }

    try {
      const key = `${STORAGE_KEY}-${userId}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
        // Si ya estaba marcado como visto, mantener el ref
        if (parsed.hasSeenOnboarding) {
          markedAsSeenRef.current = true;
        }
      } else {
        // No hay datos guardados - mostrar onboarding
        setState({
          currentStep: 'welcome',
          completedSteps: [],
          hasSeenOnboarding: false,
        });
      }
      
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('[Onboarding] Error loading state:', error);
      // En caso de error, marcar como visto para evitar bucle
      setState(prev => ({ ...prev, hasSeenOnboarding: true }));
    } finally {
      setIsLoading(false);
    }
  }, [status, userId]);

  // Persistir estado en localStorage
  const persistState = useCallback((newState: OnboardingState) => {
    if (!userId) {
      console.warn('[Onboarding] No userId available for persistence');
      return;
    }

    try {
      const key = `${STORAGE_KEY}-${userId}`;
      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
      
      if (newState.hasSeenOnboarding) {
        markedAsSeenRef.current = true;
      }
    } catch (error) {
      console.error('[Onboarding] Error saving state:', error);
    }
  }, [userId]);

  // Marcar paso como completado
  const completeStep = useCallback((step: OnboardingStep) => {
    const newCompletedSteps = [...state.completedSteps, step];
    persistState({
      ...state,
      completedSteps: newCompletedSteps,
    });
  }, [state, persistState]);

  // Ir al siguiente paso
  const nextStep = useCallback((step: OnboardingStep) => {
    persistState({
      ...state,
      currentStep: step,
    });
  }, [state, persistState]);

  // Marcar onboarding como visto
  const markOnboardingAsSeen = useCallback(() => {
    // Evitar múltiples llamadas
    if (markedAsSeenRef.current) {
      return;
    }
    
    markedAsSeenRef.current = true;
    
    const newState = {
      ...state,
      hasSeenOnboarding: true,
      currentStep: 'completed' as OnboardingStep,
    };
    
    // Actualizar estado inmediatamente para evitar re-renders
    setState(newState);
    
    // Persistir
    if (userId) {
      try {
        const key = `${STORAGE_KEY}-${userId}`;
        localStorage.setItem(key, JSON.stringify(newState));
      } catch (error) {
        console.error('[Onboarding] Error persisting seen state:', error);
      }
    }
  }, [state, userId]);

  // Reiniciar onboarding (útil para testing o si usuario quiere verlo de nuevo)
  const resetOnboarding = useCallback(() => {
    markedAsSeenRef.current = false;
    hasLoadedRef.current = false;
    persistState({
      currentStep: 'welcome',
      completedSteps: [],
      hasSeenOnboarding: false,
    });
  }, [persistState]);

  // Verificar si el onboarding debe mostrarse
  // Solo mostrar si:
  // 1. No estamos cargando
  // 2. No ha sido marcado como visto (ni en state ni en ref)
  // 3. Hay un usuario autenticado
  // 4. La sesión no está en estado 'loading'
  const shouldShowOnboarding = 
    !isLoading && 
    !state.hasSeenOnboarding && 
    !markedAsSeenRef.current &&
    status === 'authenticated' &&
    !!userId;

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

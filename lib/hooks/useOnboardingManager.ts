/**
 * Hook centralizado para gestionar elementos de onboarding/ayuda
 * 
 * REGLA: Solo UN elemento de onboarding puede mostrarse a la vez
 * 
 * Prioridad (de mayor a menor):
 * 1. FirstTimeSetupWizard (usuario nuevo, primera vez)
 * 2. OnboardingTour (tour guiado Joyride)
 * 3. OnboardingChecklist (checklist de pasos)
 * 4. FloatingTourButton (botón de ayuda)
 * 5. IntelligentSupportChatbot (chatbot)
 * 
 * Esto evita la "fatiga de onboarding" donde múltiples elementos
 * compiten por la atención del usuario.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnboardingElement = 
  | 'setup-wizard'      // FirstTimeSetupWizard
  | 'tour'              // OnboardingTour (Joyride)
  | 'checklist'         // OnboardingChecklist
  | 'tour-button'       // FloatingTourButton
  | 'chatbot'           // IntelligentSupportChatbot
  | 'contextual-help'   // ContextualHelp
  | null;

interface OnboardingManagerState {
  // Elemento actualmente visible (solo uno a la vez)
  activeElement: OnboardingElement;
  
  // Elementos que el usuario ha descartado permanentemente
  dismissedElements: OnboardingElement[];
  
  // Elementos que el usuario ha completado
  completedElements: OnboardingElement[];
  
  // Si el onboarding está globalmente deshabilitado
  isOnboardingDisabled: boolean;
  
  // Acciones
  setActiveElement: (element: OnboardingElement) => void;
  dismissElement: (element: OnboardingElement) => void;
  completeElement: (element: OnboardingElement) => void;
  resetElement: (element: OnboardingElement) => void;
  disableOnboarding: () => void;
  enableOnboarding: () => void;
  
  // Helpers
  canShowElement: (element: OnboardingElement) => boolean;
  isElementDismissed: (element: OnboardingElement) => boolean;
  isElementCompleted: (element: OnboardingElement) => boolean;
}

// Prioridad de elementos (menor número = mayor prioridad)
const ELEMENT_PRIORITY: Record<NonNullable<OnboardingElement>, number> = {
  'setup-wizard': 1,
  'tour': 2,
  'checklist': 3,
  'tour-button': 4,
  'chatbot': 5,
  'contextual-help': 6,
};

export const useOnboardingManager = create<OnboardingManagerState>()(
  persist(
    (set, get) => ({
      activeElement: null,
      dismissedElements: [],
      completedElements: [],
      isOnboardingDisabled: false,

      setActiveElement: (element) => {
        const state = get();
        
        // No hacer nada si onboarding está deshabilitado
        if (state.isOnboardingDisabled && element !== null) {
          return;
        }
        
        // No mostrar elementos descartados o completados
        if (element && (
          state.dismissedElements.includes(element) ||
          state.completedElements.includes(element)
        )) {
          return;
        }
        
        // Si ya hay un elemento activo, solo reemplazar si el nuevo tiene mayor prioridad
        if (state.activeElement && element) {
          const currentPriority = ELEMENT_PRIORITY[state.activeElement];
          const newPriority = ELEMENT_PRIORITY[element];
          
          if (newPriority >= currentPriority) {
            // El nuevo elemento tiene menor o igual prioridad, no reemplazar
            return;
          }
        }
        
        set({ activeElement: element });
      },

      dismissElement: (element) => {
        if (!element) return;
        
        set((state) => {
          const newDismissed = state.dismissedElements.includes(element)
            ? state.dismissedElements
            : [...state.dismissedElements, element];
          
          return {
            dismissedElements: newDismissed,
            // Si el elemento descartado era el activo, limpiarlo
            activeElement: state.activeElement === element ? null : state.activeElement,
          };
        });
      },

      completeElement: (element) => {
        if (!element) return;
        
        set((state) => {
          const newCompleted = state.completedElements.includes(element)
            ? state.completedElements
            : [...state.completedElements, element];
          
          return {
            completedElements: newCompleted,
            // Si el elemento completado era el activo, limpiarlo
            activeElement: state.activeElement === element ? null : state.activeElement,
          };
        });
      },

      resetElement: (element) => {
        if (!element) return;
        
        set((state) => ({
          dismissedElements: state.dismissedElements.filter(e => e !== element),
          completedElements: state.completedElements.filter(e => e !== element),
        }));
      },

      disableOnboarding: () => {
        set({ isOnboardingDisabled: true, activeElement: null });
      },

      enableOnboarding: () => {
        set({ isOnboardingDisabled: false });
      },

      canShowElement: (element) => {
        if (!element) return false;
        
        const state = get();
        
        // Verificar si onboarding está deshabilitado
        if (state.isOnboardingDisabled) return false;
        
        // Verificar si está descartado o completado
        if (state.dismissedElements.includes(element)) return false;
        if (state.completedElements.includes(element)) return false;
        
        // Verificar si hay otro elemento activo con mayor prioridad
        if (state.activeElement && state.activeElement !== element) {
          const activePriority = ELEMENT_PRIORITY[state.activeElement];
          const elementPriority = ELEMENT_PRIORITY[element];
          
          // Si el elemento activo tiene mayor o igual prioridad, no mostrar este
          if (activePriority <= elementPriority) {
            return false;
          }
        }
        
        return true;
      },

      isElementDismissed: (element) => {
        if (!element) return false;
        return get().dismissedElements.includes(element);
      },

      isElementCompleted: (element) => {
        if (!element) return false;
        return get().completedElements.includes(element);
      },
    }),
    {
      name: 'inmova-onboarding-manager',
      // Solo persistir dismissedElements y completedElements
      partialize: (state) => ({
        dismissedElements: state.dismissedElements,
        completedElements: state.completedElements,
        isOnboardingDisabled: state.isOnboardingDisabled,
      }),
    }
  )
);

/**
 * Hook simplificado para componentes individuales
 */
export function useOnboardingElement(element: NonNullable<OnboardingElement>) {
  const {
    activeElement,
    canShowElement,
    setActiveElement,
    dismissElement,
    completeElement,
  } = useOnboardingManager();
  
  const isActive = activeElement === element;
  const canShow = canShowElement(element);
  
  const show = () => {
    if (canShow) {
      setActiveElement(element);
    }
  };
  
  const hide = () => {
    if (isActive) {
      setActiveElement(null);
    }
  };
  
  const dismiss = () => {
    dismissElement(element);
  };
  
  const complete = () => {
    completeElement(element);
  };
  
  return {
    isActive,
    canShow,
    show,
    hide,
    dismiss,
    complete,
  };
}

export default useOnboardingManager;

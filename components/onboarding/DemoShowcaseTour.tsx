'use client';

/**
 * DEMO SHOWCASE TOUR — GRUPO VIDARO
 * 
 * Tour NAVEGABLE: cada paso lleva al usuario a la página real de la funcionalidad.
 * Overlay modal con navegación anterior/siguiente y barra de progreso.
 * 
 * Flujo: Navegar a ruta → Esperar carga → Mostrar overlay con explicación
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_STEPS, DEMO_USER_EMAIL, type DemoStep } from '@/lib/onboarding-demo-tour';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Presentation, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'inmova-demo-tour-state';

interface TourState {
  stepIndex: number;
  completed: boolean;
}

export function DemoShowcaseTour() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const mountedRef = useRef(false);

  const isDemoUser = session?.user?.email === DEMO_USER_EMAIL;
  const step = DEMO_STEPS[stepIndex] as DemoStep | undefined;
  const totalSteps = DEMO_STEPS.length;

  // Auto-start on first visit
  useEffect(() => {
    if (!isDemoUser || mountedRef.current) return;
    mountedRef.current = true;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: TourState = JSON.parse(stored);
        if (state.completed) {
          setShowControls(true);
          setStepIndex(state.stepIndex);
          return;
        }
        // Resume from where they left off
        setStepIndex(state.stepIndex);
      }
    } catch { /* ignore */ }

    // Auto-start after a delay
    const timer = setTimeout(() => {
      setActive(true);
      navigateToStep(0);
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoUser]);

  // Save state
  const saveState = useCallback((index: number, completed: boolean) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stepIndex: index, completed }));
    } catch { /* ignore */ }
  }, []);

  // Navigate to a step's route
  const navigateToStep = useCallback((index: number) => {
    const target = DEMO_STEPS[index];
    if (!target) return;

    if (target.route && target.route !== pathname) {
      setNavigating(true);
      router.push(target.route);
      // Wait for navigation + page load
      setTimeout(() => {
        setNavigating(false);
        setStepIndex(index);
        saveState(index, false);
      }, 1200);
    } else {
      setStepIndex(index);
      saveState(index, false);
    }
  }, [pathname, router, saveState]);

  const handleNext = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      navigateToStep(stepIndex + 1);
    } else {
      // Tour completed
      setActive(false);
      setShowControls(true);
      saveState(stepIndex, true);
    }
  }, [stepIndex, totalSteps, navigateToStep, saveState]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      navigateToStep(stepIndex - 1);
    }
  }, [stepIndex, navigateToStep]);

  const handleClose = useCallback(() => {
    setActive(false);
    setShowControls(true);
    saveState(stepIndex, true);
  }, [stepIndex, saveState]);

  const handlePresent = useCallback(() => {
    setShowControls(false);
    setStepIndex(0);
    setActive(true);
    navigateToStep(0);
  }, [navigateToStep]);

  const handleResume = useCallback(() => {
    setShowControls(false);
    setActive(true);
    navigateToStep(stepIndex);
  }, [stepIndex, navigateToStep]);

  if (!isDemoUser) return null;

  return (
    <>
      {/* TOUR OVERLAY */}
      <AnimatePresence>
        {active && step && !navigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleClose} />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="relative z-10 w-full max-w-xl mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                  />
                </div>

                {/* Step Counter + Close */}
                <div className="flex items-center justify-between px-5 pt-3">
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    PASO {stepIndex + 1} / {totalSteps}
                  </span>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Step Content */}
                <div className="px-5 py-4">
                  {step.content}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={stepIndex === 0}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  {/* Step dots */}
                  <div className="flex gap-1">
                    {DEMO_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === stepIndex
                            ? 'w-4 bg-indigo-500'
                            : i < stepIndex
                            ? 'w-1.5 bg-indigo-300'
                            : 'w-1.5 bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {stepIndex === totalSteps - 1 ? (
                      <>Explorar ✨</>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator during navigation */}
      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30"
          >
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Navegando...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls when tour is paused/completed */}
      {showControls && !active && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
          {stepIndex > 0 && stepIndex < totalSteps - 1 && (
            <Button
              onClick={handleResume}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-gray-50 transition-all"
            >
              <ChevronRight className="h-3.5 w-3.5 mr-1 text-gray-600" />
              <span className="text-gray-700 text-xs">Continuar ({stepIndex + 1}/{totalSteps})</span>
            </Button>
          )}
          <Button
            onClick={handlePresent}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Presentation className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Presentar Demo</span>
          </Button>
        </div>
      )}
    </>
  );
}

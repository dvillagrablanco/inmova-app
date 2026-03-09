'use client';

/**
 * DEMO SHOWCASE TOUR — GRUPO VIDARO
 * 
 * Tour NAVEGABLE: cada paso lleva al usuario a la página real.
 * Estado persistido en sessionStorage para sobrevivir a las navegaciones de Next.js.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_STEPS, DEMO_USER_EMAIL } from '@/lib/onboarding-demo-tour';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Presentation } from 'lucide-react';

const STORAGE_KEY = 'inmova-demo-tour';

interface TourState {
  active: boolean;
  stepIndex: number;
  completed: boolean;
}

function readState(): TourState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { active: false, stepIndex: 0, completed: false };
}

function writeState(state: TourState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export default function DemoShowcaseTour() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const initializedRef = useRef(false);

  const isDemoUser = session?.user?.email === DEMO_USER_EMAIL;
  const totalSteps = DEMO_STEPS.length;
  const step = DEMO_STEPS[stepIndex];

  // ── INIT: Read persisted state on mount ──
  useEffect(() => {
    if (status === 'loading' || !isDemoUser || initializedRef.current) return;
    initializedRef.current = true;

    const state = readState();

    if (state.completed) {
      // Tour was completed, show restart controls
      setStepIndex(state.stepIndex);
      setShowControls(true);
      return;
    }

    if (state.active) {
      // Tour is in progress (we came back from a navigation)
      setStepIndex(state.stepIndex);
      // Check if we're on the right page
      const expectedRoute = DEMO_STEPS[state.stepIndex]?.route;
      if (!expectedRoute || pathname?.startsWith(expectedRoute)) {
        // We're on the right page, show the overlay
        setActive(true);
      } else {
        // Wrong page, navigate to the right one
        router.push(expectedRoute);
        // The next mount will catch us in the right state
      }
      return;
    }

    // First time — auto-start after delay
    const timer = setTimeout(() => {
      const s: TourState = { active: true, stepIndex: 0, completed: false };
      writeState(s);
      setActive(true);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isDemoUser]);

  // ── When pathname changes while tour is active, show overlay if on correct page ──
  useEffect(() => {
    if (!isDemoUser || !initializedRef.current) return;
    const state = readState();
    if (!state.active) return;

    const expectedRoute = DEMO_STEPS[state.stepIndex]?.route;
    if (expectedRoute && pathname?.startsWith(expectedRoute)) {
      setStepIndex(state.stepIndex);
      setActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isDemoUser]);

  // ── NAVIGATE to a step ──
  const goToStep = useCallback((index: number) => {
    const target = DEMO_STEPS[index];
    if (!target) return;

    // Persist state BEFORE navigating (survives remount)
    const newState: TourState = { active: true, stepIndex: index, completed: false };
    writeState(newState);
    setStepIndex(index);

    if (target.route && !pathname?.startsWith(target.route)) {
      // Navigate — component will remount, read state from sessionStorage
      setActive(false); // hide overlay during transition
      router.push(target.route);
    } else {
      // Same page — just show overlay
      setActive(true);
    }
  }, [pathname, router]);

  const handleNext = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      goToStep(stepIndex + 1);
    } else {
      // Complete
      writeState({ active: false, stepIndex: stepIndex, completed: true });
      setActive(false);
      setShowControls(true);
    }
  }, [stepIndex, totalSteps, goToStep]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    }
  }, [stepIndex, goToStep]);

  const handleClose = useCallback(() => {
    writeState({ active: false, stepIndex, completed: true });
    setActive(false);
    setShowControls(true);
  }, [stepIndex]);

  const handlePresent = useCallback(() => {
    writeState({ active: true, stepIndex: 0, completed: false });
    setShowControls(false);
    setStepIndex(0);
    const firstRoute = DEMO_STEPS[0]?.route;
    if (firstRoute && !pathname?.startsWith(firstRoute)) {
      router.push(firstRoute);
    } else {
      setActive(true);
    }
  }, [pathname, router]);

  const handleResume = useCallback(() => {
    setShowControls(false);
    goToStep(stepIndex);
  }, [stepIndex, goToStep]);

  if (!isDemoUser) return null;

  return (
    <>
      {/* TOUR OVERLAY */}
      <AnimatePresence>
        {active && step && (
          <motion.div
            key={`step-${stepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="relative z-10 w-full max-w-xl mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-100">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                {/* Step Counter + Close */}
                <div className="flex items-center justify-between px-5 pt-3">
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    PASO {stepIndex + 1} / {totalSteps}
                  </span>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cerrar (puede continuar después)"
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

      {/* Controls when tour is paused/completed */}
      {showControls && !active && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
          {stepIndex > 0 && stepIndex < totalSteps - 1 && (
            <Button
              onClick={handleResume}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-gray-50"
            >
              <ChevronRight className="h-3.5 w-3.5 mr-1 text-gray-600" />
              <span className="text-gray-700 text-xs">Continuar ({stepIndex + 1}/{totalSteps})</span>
            </Button>
          )}
          <Button
            onClick={handlePresent}
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

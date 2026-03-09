'use client';

/**
 * DEMO SHOWCASE TOUR — GRUPO VIDARO
 *
 * Panel flotante abajo-derecha que permite ver e interactuar con la app
 * mientras narra cada sección. Se puede minimizar a un botón.
 * Estado persistido en sessionStorage para sobrevivir a las navegaciones.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_STEPS, DEMO_USER_EMAIL } from '@/lib/onboarding-demo-tour';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  Minus,
  Maximize2,
} from 'lucide-react';

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
  } catch {
    /* ignore */
  }
  return { active: false, stepIndex: 0, completed: false };
}

function writeState(state: TourState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export default function DemoShowcaseTour() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [minimized, setMinimized] = useState(false);
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
      setStepIndex(state.stepIndex);
      setShowControls(true);
      return;
    }

    if (state.active) {
      setStepIndex(state.stepIndex);
      const expectedRoute = DEMO_STEPS[state.stepIndex]?.route;
      if (!expectedRoute || pathname?.startsWith(expectedRoute)) {
        setActive(true);
      } else {
        router.push(expectedRoute);
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

  // ── When pathname changes while tour is active ──
  useEffect(() => {
    if (!isDemoUser || !initializedRef.current) return;
    const state = readState();
    if (!state.active) return;

    const expectedRoute = DEMO_STEPS[state.stepIndex]?.route;
    if (expectedRoute && pathname?.startsWith(expectedRoute)) {
      setStepIndex(state.stepIndex);
      setActive(true);
      setMinimized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isDemoUser]);

  // ── NAVIGATE to a step ──
  const goToStep = useCallback(
    (index: number) => {
      const target = DEMO_STEPS[index];
      if (!target) return;

      const newState: TourState = {
        active: true,
        stepIndex: index,
        completed: false,
      };
      writeState(newState);
      setStepIndex(index);
      setMinimized(false);

      if (target.route && !pathname?.startsWith(target.route)) {
        setActive(false);
        router.push(target.route);
      } else {
        setActive(true);
      }
    },
    [pathname, router]
  );

  const handleNext = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      goToStep(stepIndex + 1);
    } else {
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
    setMinimized(false);
    setShowControls(true);
  }, [stepIndex]);

  const handleMinimize = useCallback(() => {
    setMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    setMinimized(false);
  }, []);

  const handlePresent = useCallback(() => {
    writeState({ active: true, stepIndex: 0, completed: false });
    setShowControls(false);
    setMinimized(false);
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
      {/* ── MINIMIZED: floating pill button ── */}
      <AnimatePresence>
        {active && minimized && (
          <motion.button
            key="minimized-pill"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={handleExpand}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <Presentation className="h-4 w-4" />
            <span className="text-xs font-semibold">
              Paso {stepIndex + 1}/{totalSteps}
            </span>
            <Maximize2 className="h-3.5 w-3.5 opacity-70" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── EXPANDED: floating panel bottom-right ── */}
      <AnimatePresence mode="wait">
        {active && !minimized && step && (
          <motion.div
            key={`panel-step-${stepIndex}`}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-gray-100">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={false}
                  animate={{
                    width: `${((stepIndex + 1) / totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Header: Step counter + controls */}
              <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {stepIndex + 1} / {totalSteps}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleMinimize}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Minimizar"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cerrar tour"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Step Content */}
              <div className="px-4 pb-3">{step.content}</div>

              {/* Navigation footer */}
              <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={stepIndex === 0}
                  className="text-gray-500 h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  Ant.
                </Button>

                {/* Step dots */}
                <div className="flex gap-0.5">
                  {DEMO_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === stepIndex
                          ? 'w-3.5 h-1.5 bg-indigo-500'
                          : i < stepIndex
                            ? 'w-1.5 h-1.5 bg-indigo-300 hover:bg-indigo-400'
                            : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 h-8 px-3 text-xs"
                >
                  {stepIndex === totalSteps - 1 ? (
                    'Explorar ✨'
                  ) : (
                    <>
                      Sig.
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls when tour is paused/completed ── */}
      {showControls && !active && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {stepIndex > 0 && stepIndex < totalSteps - 1 && (
            <Button
              onClick={handleResume}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-gray-50"
            >
              <ChevronRight className="h-3.5 w-3.5 mr-1 text-gray-600" />
              <span className="text-gray-700 text-xs">
                Continuar ({stepIndex + 1}/{totalSteps})
              </span>
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

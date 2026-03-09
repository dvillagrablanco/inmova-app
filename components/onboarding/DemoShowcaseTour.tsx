'use client';

/**
 * DEMO SHOWCASE TOUR — GRUPO VIDARO (v2 Interactivo)
 *
 * Panel lateral narrador + Spotlight en elementos reales + Tareas interactivas.
 * La app es visible y usable en todo momento. El tour guía sin bloquear.
 *
 * Modos de paso:
 *  - cinematic: fullscreen con backdrop (solo welcome/closing)
 *  - narrator: panel lateral, app 100% visible
 *  - spotlight: panel lateral + highlight pulsante en target(s)
 *  - task: panel lateral + highlight + tarea interactiva a completar
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DEMO_STEPS,
  DEMO_USER_EMAIL,
  type DemoStep,
  type StepMode,
} from '@/lib/onboarding-demo-tour';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  CheckCircle2,
  MousePointerClick,
  Eye,
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
    /* SSR-safe */
  }
  return { active: false, stepIndex: 0, completed: false };
}

function writeState(state: TourState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* SSR-safe */
  }
}

const ACT_COLORS: Record<number, { bg: string; text: string; border: string; gradient: string }> = {
  1: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    gradient: 'from-red-500 to-orange-500',
  },
  2: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    gradient: 'from-indigo-500 to-purple-500',
  },
  3: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
  },
  4: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    gradient: 'from-green-500 to-emerald-500',
  },
};

const STAT_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify'];

export default function DemoShowcaseTour() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const initializedRef = useRef(false);
  const taskTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spotlightCleanupRef = useRef<(() => void) | null>(null);

  const isAuthRoute = !pathname || AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDemoUser = status === 'authenticated' && session?.user?.email === DEMO_USER_EMAIL;
  const totalSteps = DEMO_STEPS.length;
  const step = DEMO_STEPS[stepIndex];

  // ── Spotlight management ──
  const applySpotlight = useCallback((targets?: string[]) => {
    if (spotlightCleanupRef.current) {
      spotlightCleanupRef.current();
      spotlightCleanupRef.current = null;
    }

    if (!targets || targets.length === 0) return;

    const elements: HTMLElement[] = [];
    const styleId = 'demo-tour-spotlight-style';

    let existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = styleId;
      document.head.appendChild(existingStyle);
    }

    existingStyle.textContent = `
      @keyframes demo-tour-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
      }
      .demo-tour-spotlight {
        position: relative;
        z-index: 40 !important;
        animation: demo-tour-pulse 2s ease-in-out infinite;
        outline: 2px solid rgba(99, 102, 241, 0.6);
        outline-offset: 4px;
        border-radius: 8px;
        transition: outline 0.3s ease;
      }
    `;

    requestAnimationFrame(() => {
      targets.forEach((selector) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) {
          el.classList.add('demo-tour-spotlight');
          elements.push(el);
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    spotlightCleanupRef.current = () => {
      elements.forEach((el) => el.classList.remove('demo-tour-spotlight'));
    };
  }, []);

  const clearSpotlight = useCallback(() => {
    if (spotlightCleanupRef.current) {
      spotlightCleanupRef.current();
      spotlightCleanupRef.current = null;
    }
  }, []);

  // ── Task auto-complete timer ──
  const startTaskTimer = useCallback((step: DemoStep) => {
    if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
    setTaskCompleted(false);

    if (step.task?.autoCompleteMs) {
      taskTimerRef.current = setTimeout(() => {
        setTaskCompleted(true);
      }, step.task.autoCompleteMs);
    }

    if (step.task?.triggerSelector) {
      const handler = () => {
        setTaskCompleted(true);
        if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
      };
      const el = document.querySelector(step.task.triggerSelector);
      if (el) {
        el.addEventListener('click', handler, { once: true });
        const prevCleanup = spotlightCleanupRef.current;
        spotlightCleanupRef.current = () => {
          prevCleanup?.();
          el.removeEventListener('click', handler);
        };
      }
    }
  }, []);

  // ── Reset initialization when user context changes (login/logout) ──
  useEffect(() => {
    if (!isDemoUser) {
      initializedRef.current = false;
    }
  }, [isDemoUser]);

  // ── INIT ──
  useEffect(() => {
    if (status === 'loading' || !isDemoUser || isAuthRoute || initializedRef.current) return;
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

    const timer = setTimeout(() => {
      writeState({ active: true, stepIndex: 0, completed: false });
      setActive(true);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isDemoUser, isAuthRoute]);

  // ── Force-hide on auth routes (cleanup after logout) ──
  useEffect(() => {
    if (isAuthRoute && active) {
      clearSpotlight();
      setActive(false);
      setShowControls(false);
      setMinimized(false);
    }
  }, [isAuthRoute, active, clearSpotlight]);

  // ── Pathname change → re-show if on correct page ──
  useEffect(() => {
    if (!isDemoUser || isAuthRoute || !initializedRef.current) return;
    const state = readState();
    if (!state.active) return;

    const expectedRoute = DEMO_STEPS[state.stepIndex]?.route;
    if (expectedRoute && pathname?.startsWith(expectedRoute)) {
      setStepIndex(state.stepIndex);
      setActive(true);
    }
  }, [pathname, isDemoUser, isAuthRoute]);

  // ── Apply spotlight when step changes ──
  useEffect(() => {
    if (!active || !step) return;

    const timer = setTimeout(() => {
      applySpotlight(step.spotlightTargets);
      if (step.task) startTaskTimer(step);
    }, 400);

    return () => {
      clearTimeout(timer);
      clearSpotlight();
      if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  // ── NAVIGATION ──
  const goToStep = useCallback(
    (index: number) => {
      const target = DEMO_STEPS[index];
      if (!target) return;

      clearSpotlight();
      setTaskCompleted(false);
      if (taskTimerRef.current) clearTimeout(taskTimerRef.current);

      const newState: TourState = { active: true, stepIndex: index, completed: false };
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
    [pathname, router, clearSpotlight]
  );

  const handleNext = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      goToStep(stepIndex + 1);
    } else {
      clearSpotlight();
      writeState({ active: false, stepIndex, completed: true });
      setActive(false);
      setShowControls(true);
    }
  }, [stepIndex, totalSteps, goToStep, clearSpotlight]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  const handleClose = useCallback(() => {
    clearSpotlight();
    writeState({ active: false, stepIndex, completed: true });
    setActive(false);
    setShowControls(true);
  }, [stepIndex, clearSpotlight]);

  const handlePresent = useCallback(() => {
    writeState({ active: true, stepIndex: 0, completed: false });
    setShowControls(false);
    setStepIndex(0);
    setMinimized(false);
    setTaskCompleted(false);
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

  if (!isDemoUser || isAuthRoute) return null;

  const isCinematic = step?.mode === 'cinematic';
  const actColor = step ? ACT_COLORS[step.act] : ACT_COLORS[1];
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════

  return (
    <>
      {/* ── CINEMATIC MODE (fullscreen moments — welcome & closing) ── */}
      <AnimatePresence>
        {active && step && isCinematic && (
          <motion.div
            key={`cinematic-${stepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative z-10 w-full max-w-md mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Progress */}
                <div className="h-1 bg-gray-100">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${actColor.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <div className="p-6">
                  {/* Act Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${actColor.bg} ${actColor.text}`}
                    >
                      ACTO {step.act} — {step.actTitle}
                    </span>
                    <button
                      onClick={handleClose}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h2>

                  {/* Narration */}
                  <div className="mb-4">{step.narration}</div>

                  {/* Stats */}
                  {step.stats && (
                    <div
                      className={`grid gap-2 mb-4 ${step.stats.length <= 4 ? `grid-cols-${step.stats.length}` : 'grid-cols-3'}`}
                    >
                      {step.stats.map((stat, i) => (
                        <div
                          key={i}
                          className={`text-center p-2 rounded-xl border ${STAT_COLORS[stat.color] || STAT_COLORS.gray}`}
                        >
                          <div className="text-lg font-bold">{stat.value}</div>
                          <div className="text-[10px] font-medium">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hint */}
                  {step.hint && (
                    <p className="text-[10px] text-gray-400 text-center mb-4">{step.hint}</p>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
                    <StepDots current={stepIndex} total={totalSteps} />
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className={`bg-gradient-to-r ${actColor.gradient} text-white hover:opacity-90`}
                    >
                      {stepIndex === totalSteps - 1 ? 'Explorar' : 'Siguiente'}
                      {stepIndex < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIDE PANEL (narrator / spotlight / task modes) ── */}
      <AnimatePresence>
        {active && step && !isCinematic && !minimized && (
          <motion.div
            key={`panel-${stepIndex}`}
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-4 right-4 bottom-4 z-[9998] w-[340px] flex flex-col"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col h-full overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-gray-100 flex-shrink-0">
                <motion.div
                  className={`h-full bg-gradient-to-r ${actColor.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${actColor.bg} ${actColor.text}`}
                  >
                    ACTO {step.act}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {stepIndex + 1}/{totalSteps}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMinimized(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Minimizar — explore libremente"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
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

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-4 pb-3">
                {/* Mode indicator */}
                <div className="flex items-center gap-1.5 mb-2">
                  <ModeIcon mode={step.mode} />
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                    {step.mode === 'task'
                      ? 'Interactivo'
                      : step.mode === 'spotlight'
                        ? 'Observar'
                        : 'Narración'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight">
                  {step.title}
                </h3>

                {/* Narration */}
                <div className="mb-3">{step.narration}</div>

                {/* Stats grid */}
                {step.stats && (
                  <div
                    className={`grid gap-1.5 mb-3 ${step.stats.length > 4 ? 'grid-cols-3' : `grid-cols-${Math.min(step.stats.length, 4)}`}`}
                  >
                    {step.stats.map((stat, i) => (
                      <div
                        key={i}
                        className={`text-center p-1.5 rounded-lg border ${STAT_COLORS[stat.color] || STAT_COLORS.gray}`}
                      >
                        <div className="text-sm font-bold">{stat.value}</div>
                        <div className="text-[9px] font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Before/After */}
                {step.comparison && (
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 text-center p-1.5 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-[9px] font-bold text-red-700">❌ Antes</div>
                      <div className="text-[9px] text-red-600 mt-0.5">{step.comparison.before}</div>
                    </div>
                    <div className="flex-1 text-center p-1.5 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-[9px] font-bold text-green-700">✅ Con INMOVA</div>
                      <div className="text-[9px] text-green-600 mt-0.5">
                        {step.comparison.after}
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Task */}
                {step.task && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`rounded-xl p-3 border ${
                      taskCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-indigo-50 border-indigo-200'
                    }`}
                  >
                    {taskCompleted ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs text-green-700 font-medium">
                          {step.task.completedText}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MousePointerClick className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <span className="text-xs text-indigo-800 font-semibold">
                            {step.task.instruction}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-1 flex-1 bg-indigo-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-indigo-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{
                                  duration: (step.task.autoCompleteMs || 10000) / 1000,
                                  ease: 'linear',
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-indigo-400">auto</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Hint */}
                {step.hint && (
                  <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {step.hint}
                  </p>
                )}
              </div>

              {/* Footer Navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={stepIndex === 0}
                  className="text-gray-500 h-8 px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  <span className="text-xs">Ant.</span>
                </Button>

                <StepDots current={stepIndex} total={totalSteps} />

                <Button
                  size="sm"
                  onClick={handleNext}
                  className={`bg-gradient-to-r ${actColor.gradient} text-white hover:opacity-90 h-8 px-3`}
                >
                  <span className="text-xs">{stepIndex === totalSteps - 1 ? 'Fin' : 'Sig.'}</span>
                  {stepIndex < totalSteps - 1 && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MINIMIZED FLOATING BUTTON (explore mode) ── */}
      <AnimatePresence>
        {active && minimized && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[9998]"
          >
            <button
              onClick={() => setMinimized(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${actColor.gradient} text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <Maximize2 className="h-4 w-4" />
              <span className="text-xs font-medium">
                Paso {stepIndex + 1}/{totalSteps}
              </span>
              <Play className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTROLS (paused/completed) ── */}
      {showControls && !active && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
          {stepIndex > 0 && stepIndex < totalSteps - 1 && (
            <Button
              onClick={handleResume}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-gray-50"
            >
              <Play className="h-3.5 w-3.5 mr-1 text-gray-600" />
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

// ── Sub-components ──

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-3 h-1.5 bg-indigo-500'
              : i < current
                ? 'w-1.5 h-1.5 bg-indigo-300'
                : 'w-1.5 h-1.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function ModeIcon({ mode }: { mode: StepMode }) {
  const className = 'h-3 w-3';
  switch (mode) {
    case 'task':
      return <MousePointerClick className={`${className} text-indigo-500`} />;
    case 'spotlight':
      return <Eye className={`${className} text-purple-500`} />;
    default:
      return <Pause className={`${className} text-gray-400`} />;
  }
}

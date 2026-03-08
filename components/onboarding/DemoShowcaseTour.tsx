'use client';

/**
 * DEMO SHOWCASE TOUR — GRUPO VIDARO
 * 
 * Tour de presentación comercial con pasos visualmente impactantes.
 * Se activa SOLO para el usuario demo (demo@vidaroinversiones.com).
 * 
 * Features:
 * - Tour react-joyride con estilos premium
 * - Botón "Reiniciar Demo" siempre visible
 * - Pasos con métricas reales del grupo
 * - Diseñado para impresionar al equipo
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useSession } from 'next-auth/react';
import { DEMO_SHOWCASE_STEPS, DEMO_USER_EMAIL } from '@/lib/onboarding-demo-tour';
import { Button } from '@/components/ui/button';
import { RotateCcw, Presentation } from 'lucide-react';

const DEMO_TOUR_STORAGE_KEY = 'inmova-demo-tour-completed';

export function DemoShowcaseTour() {
  const { data: session } = useSession();
  const [run, setRun] = useState(false);
  const [showRestartButton, setShowRestartButton] = useState(false);
  const isProcessingRef = useRef(false);

  const userEmail = session?.user?.email;
  const isDemoUser = userEmail === DEMO_USER_EMAIL;

  // Auto-start tour for demo user
  useEffect(() => {
    if (!isDemoUser) return;

    // Check if tour was already shown in this browser session
    const completed = sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY);
    if (completed === 'true') {
      setShowRestartButton(true);
      return;
    }

    // Delay to let the page render fully
    const timer = setTimeout(() => {
      setRun(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isDemoUser]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    const finished = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finished.includes(status as any)) {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setRun(false);
      setShowRestartButton(true);
      sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, 'true');

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
    }
  }, []);

  const handleRestart = useCallback(() => {
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
    setShowRestartButton(false);
    // Small delay before restarting
    setTimeout(() => {
      setRun(true);
    }, 300);
  }, []);

  if (!isDemoUser) return null;

  return (
    <>
      <Joyride
        steps={DEMO_SHOWCASE_STEPS}
        run={run}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        callback={handleCallback}
        floaterProps={{
          styles: {
            floater: {
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))',
            },
          },
        }}
        styles={{
          options: {
            primaryColor: '#4f46e5', // indigo-600
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            arrowColor: '#ffffff',
            zIndex: 10000,
            width: 440,
          },
          tooltip: {
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
          tooltipContainer: {
            textAlign: 'left' as const,
          },
          buttonNext: {
            backgroundColor: '#4f46e5',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 12,
            fontSize: 14,
          },
          buttonSkip: {
            color: '#9ca3af',
            fontSize: 13,
          },
          spotlight: {
            borderRadius: 12,
          },
          overlay: {
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
          },
        }}
        locale={{
          back: '← Anterior',
          close: 'Cerrar',
          last: '✨ Explorar',
          next: 'Siguiente →',
          skip: 'Saltar demo',
        }}
      />

      {/* Restart Demo Button - Fixed position */}
      {showRestartButton && (
        <div className="fixed bottom-6 left-6 z-50 flex gap-2">
          <Button
            onClick={handleRestart}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
          >
            <RotateCcw className="h-4 w-4 mr-2 text-indigo-600" />
            <span className="text-indigo-700 font-medium">Reiniciar Demo</span>
          </Button>
          <Button
            onClick={handleRestart}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Presentation className="h-4 w-4 mr-2" />
            <span>Presentar</span>
          </Button>
        </div>
      )}
    </>
  );
}

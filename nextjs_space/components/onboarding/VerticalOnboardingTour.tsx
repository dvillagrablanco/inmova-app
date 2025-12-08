'use client';

import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useSession } from 'next-auth/react';
import { BusinessVertical } from '@prisma/client';
import { getUserVerticalTour, VerticalTour } from '@/lib/onboarding-tours';
import { logger } from '@/lib/logger';

interface VerticalOnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function VerticalOnboardingTour({ onComplete, onSkip }: VerticalOnboardingTourProps) {
  const { data: session } = useSession();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tour, setTour] = useState<VerticalTour | null>(null);

  // Cargar el tour basado en el vertical del usuario
  useEffect(() => {
    if (!session?.user?.businessVertical) {
      logger.warn('Usuario sin vertical de negocio definido');
      return;
    }

    const userTour = getUserVerticalTour(session.user.businessVertical as BusinessVertical);
    if (userTour) {
      setTour(userTour);
      
      // Verificar si el usuario ya ha visto el tour
      const hasSeenTour = localStorage.getItem(`onboarding_tour_${userTour.id}_completed`);
      if (!hasSeenTour) {
        // Delay para asegurar que el DOM está listo
        setTimeout(() => {
          setRun(true);
        }, 1000);
      }
    }
  }, [session?.user?.businessVertical]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);

      if (tour) {
        // Guardar en localStorage que el usuario completó el tour
        localStorage.setItem(`onboarding_tour_${tour.id}_completed`, 'true');
      }

      if (status === STATUS.FINISHED && onComplete) {
        onComplete();
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip();
      }
    } else if (type === 'step:after' && action === 'next') {
      setStepIndex(index + 1);
    } else if (type === 'step:after' && action === 'prev') {
      setStepIndex(index - 1);
    }
  }, [tour, onComplete, onSkip]);

  // Función para reiniciar el tour manualmente
  const restartTour = useCallback(() => {
    if (tour) {
      localStorage.removeItem(`onboarding_tour_${tour.id}_completed`);
      setStepIndex(0);
      setRun(true);
    }
  }, [tour]);

  // Exponer restartTour globalmente para el botón de ayuda
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).restartOnboardingTour = restartTour;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).restartOnboardingTour;
      }
    };
  }, [restartTour]);

  if (!tour || !run) {
    return null;
  }

  return (
    <Joyride
      steps={tour.steps as Step[]}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5', // Indigo-600
          textColor: '#1F2937', // Gray-800
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: 12,
        },
        tooltipContent: {
          fontSize: '0.95rem',
          lineHeight: 1.6,
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '0.95rem',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9CA3AF',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
    />
  );
}

export default VerticalOnboardingTour;

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserVerticalTour, type BusinessVertical } from '@/lib/onboarding-tours';
import logger from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VerticalOnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function VerticalOnboardingTour({ onComplete, onSkip }: VerticalOnboardingTourProps) {
  const { data: session } = useSession();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!session?.user?.businessVertical) {
      logger.warn('Usuario sin vertical de negocio definido');
      return;
    }

    const userTour = getUserVerticalTour(session.user.businessVertical as BusinessVertical);
    if (userTour) {
      // Check if user has already completed this tour
      const tourCompleted = localStorage.getItem(`tour_completed_${session.user.businessVertical}`);
      if (!tourCompleted) {
        setShowTour(true);
      }
    }
  }, [session]);

  const handleComplete = () => {
    if (session?.user?.businessVertical) {
      localStorage.setItem(`tour_completed_${session.user.businessVertical}`, 'true');
    }
    setShowTour(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setShowTour(false);
    onSkip?.();
  };

  if (!showTour) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold">Bienvenido a INMOVA</h2>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mb-6">
          El sistema de tours interactivos está temporalmente deshabilitado. 
          Explora el panel lateral para acceder a todas las funcionalidades.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Saltar
          </Button>
          <Button onClick={handleComplete}>
            Entendido
          </Button>
        </div>
      </Card>
    </div>
  );
}

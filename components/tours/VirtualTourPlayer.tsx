'use client';

/**
 * REPRODUCTOR DE TOURS VIRTUALES
 * Tour interactivo paso a paso con diferentes tipos de steps
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, Play, SkipForward, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  type: 'tooltip' | 'modal' | 'spotlight' | 'video' | 'interactive';
  title: string;
  description: string;
  target: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  highlightElement?: boolean;
  allowSkip?: boolean;
  showProgress?: boolean;
  videoUrl?: string;
  action?: {
    label: string;
    callback?: string;
  };
}

interface VirtualTour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  estimatedDuration: number;
}

interface VirtualTourPlayerProps {
  tour: VirtualTour;
  onComplete: () => void;
  onSkip: () => void;
}

export function VirtualTourPlayer({ tour, onComplete, onSkip }: VirtualTourPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = tour.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / tour.steps.length) * 100;
  const isLastStep = currentStepIndex === tour.steps.length - 1;

  useEffect(() => {
    if (!isPlaying) return;

    // Buscar el elemento target
    const targetElement = document.querySelector(currentStep.target) as HTMLElement;
    
    if (targetElement && currentStep.highlightElement) {
      setHighlightedElement(targetElement);
      
      // Scroll al elemento
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Añadir clase de highlight
      targetElement.classList.add('tour-highlight');
    }

    return () => {
      // Limpiar highlight
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStepIndex, isPlaying, currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    // Marcar tour como completado en el backend
    try {
      await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          tourId: tour.id
        })
      });
    } catch (error) {
      console.error('Error completing tour:', error);
    }

    setIsPlaying(false);
    onComplete();
  };

  const handleSkipTour = () => {
    setIsPlaying(false);
    onSkip();
  };

  const getStepPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%' };

    const rect = highlightedElement.getBoundingClientRect();
    const placement = currentStep.placement || 'bottom';

    switch (placement) {
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  if (!isPlaying) return null;

  // Render modal type
  if (currentStep.type === 'modal' || currentStep.placement === 'center') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{tour.name}</Badge>
                {currentStep.showProgress && (
                  <Badge variant="outline">
                    Paso {currentStepIndex + 1} de {tour.steps.length}
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold">{currentStep.title}</h3>
            </div>
            {currentStep.allowSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTour}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress */}
          {currentStep.showProgress && (
            <Progress value={progress} className="mb-4" />
          )}

          {/* Content */}
          <div className="space-y-4">
            <p className="text-gray-600">{currentStep.description}</p>

            {currentStep.videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <video
                  src={currentStep.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep.allowSkip && !isLastStep && (
                <Button variant="outline" onClick={handleSkipTour}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Saltar tour
                </Button>
              )}
              <Button onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render tooltip/spotlight type
  const position = getStepPosition();

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/40 pointer-events-none"
        style={{
          clipPath: highlightedElement
            ? `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%,
                ${highlightedElement.getBoundingClientRect().left - 8}px ${highlightedElement.getBoundingClientRect().top - 8}px,
                ${highlightedElement.getBoundingClientRect().left - 8}px ${highlightedElement.getBoundingClientRect().bottom + 8}px,
                ${highlightedElement.getBoundingClientRect().right + 8}px ${highlightedElement.getBoundingClientRect().bottom + 8}px,
                ${highlightedElement.getBoundingClientRect().right + 8}px ${highlightedElement.getBoundingClientRect().top - 8}px,
                ${highlightedElement.getBoundingClientRect().left - 8}px ${highlightedElement.getBoundingClientRect().top - 8}px
              )`
            : undefined
        }}
      />

      {/* Tooltip flotante */}
      <Card
        className="fixed z-50 p-4 max-w-sm animate-in fade-in zoom-in duration-200"
        style={position}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {currentStepIndex + 1}/{tour.steps.length}
              </Badge>
            </div>
            <h4 className="font-semibold">{currentStep.title}</h4>
          </div>
          {currentStep.allowSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipTour}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 mb-4">{currentStep.description}</p>

        {/* Progress */}
        {currentStep.showProgress && (
          <Progress value={progress} className="mb-3 h-1" />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Atrás
          </Button>

          <Button size="sm" onClick={handleNext}>
            {isLastStep ? 'Finalizar' : 'Siguiente'}
            {!isLastStep && <ChevronRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </Card>

      {/* CSS para highlight */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}

'use client';

/**
 * GUÍA INTERACTIVA PASO A PASO
 * Sistema de tutoriales que bloquea UI hasta completar cada paso
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Target,
  Hand,
  Eye,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  action: string; // Qué debe hacer el usuario
  targetSelector?: string; // Selector CSS del elemento
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForAction?: boolean; // Esperar acción del usuario
  autoAdvance?: boolean; // Avanzar automáticamente
  validation?: () => boolean; // Función para validar que se completó
}

interface InteractiveGuideProps {
  steps: GuideStep[];
  onComplete: () => void;
  onSkip?: () => void;
  title: string;
  description: string;
}

export function InteractiveGuide({
  steps,
  onComplete,
  onSkip,
  title,
  description
}: InteractiveGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    // Buscar elemento target
    if (currentStep?.targetSelector) {
      const element = document.querySelector(currentStep.targetSelector) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Scroll al elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight del elemento
        element.classList.add('guide-highlight');
        element.style.position = 'relative';
        element.style.zIndex = '9999';

        return () => {
          element.classList.remove('guide-highlight');
          element.style.zIndex = '';
        };
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    setCompletedSteps([...completedSteps, currentStep.id]);
    setCurrentStepIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps([...completedSteps, currentStep.id]);
    onComplete();
  };

  const getTooltipPosition = () => {
    if (!targetElement || currentStep.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 400;
    const tooltipHeight = 300;
    const gap = 20;

    switch (currentStep.position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: Math.max(gap, rect.top - tooltipHeight - gap),
          left: Math.min(window.innerWidth - tooltipWidth - gap, Math.max(gap, rect.left + rect.width / 2 - tooltipWidth / 2))
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: Math.min(window.innerHeight - tooltipHeight - gap, rect.bottom + gap),
          left: Math.min(window.innerWidth - tooltipWidth - gap, Math.max(gap, rect.left + rect.width / 2 - tooltipWidth / 2))
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: Math.min(window.innerHeight - tooltipHeight - gap, Math.max(gap, rect.top + rect.height / 2 - tooltipHeight / 2)),
          left: Math.max(gap, rect.left - tooltipWidth - gap)
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: Math.min(window.innerHeight - tooltipHeight - gap, Math.max(gap, rect.top + rect.height / 2 - tooltipHeight / 2)),
          left: Math.min(window.innerWidth - tooltipWidth - gap, rect.right + gap)
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      {/* Tooltip de guía */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={getTooltipPosition()}
          className="z-[9999] w-[400px]"
        >
          <Card className="bg-white shadow-2xl border-2 border-indigo-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">Guía Interactiva</span>
                </div>
                <span className="text-sm">Paso {currentStepIndex + 1} de {steps.length}</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-indigo-300" />
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Título del paso */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{currentStep.title}</h3>
                <p className="text-gray-600 leading-relaxed">{currentStep.description}</p>
              </div>

              {/* Acción a realizar */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-start gap-3">
                  <Hand className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 mb-1">¿Qué debes hacer?</p>
                    <p className="text-sm text-indigo-700">{currentStep.action}</p>
                  </div>
                </div>
              </div>

              {/* Indicador visual si hay elemento target */}
              {targetElement && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>Mira el elemento resaltado</span>
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
              <div>
                {currentStepIndex > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onSkip && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    size="sm"
                    className="text-gray-500"
                  >
                    Saltar guía
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                  size="sm"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Estilos para highlight */}
      <style jsx global>{`
        .guide-highlight {
          animation: guide-pulse 2s ease-in-out infinite;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4),
                      0 0 0 8px rgba(99, 102, 241, 0.2),
                      0 0 30px rgba(99, 102, 241, 0.3);
          border-radius: 8px;
        }

        @keyframes guide-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4),
                        0 0 0 8px rgba(99, 102, 241, 0.2),
                        0 0 30px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.5),
                        0 0 0 12px rgba(99, 102, 241, 0.3),
                        0 0 40px rgba(99, 102, 241, 0.4);
          }
        }
      `}</style>
    </>
  );
}

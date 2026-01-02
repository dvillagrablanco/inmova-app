'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  ArrowRight,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { useSession } from 'next-auth/react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  required: boolean;
  order: number;
  videoUrl?: string;
  estimatedTime?: number;
}

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  percentageComplete: number;
  steps: OnboardingStep[];
  vertical: string;
}

export default function SmartOnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // No mostrar tutorial para super_admin (expertos en la herramienta)
  const isSuperAdmin = session?.user?.role === 'super_admin';
  
  if (isSuperAdmin) {
    return null;
  }

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const res = await fetch('/api/onboarding/progress');
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
        
        // Si ya está completado, no mostrar
        if (data.percentageComplete === 100) {
          setIsVisible(false);
        }
      }
    } catch (error) {
      logger.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = async (step: OnboardingStep) => {
    if (step.action === 'acknowledge') {
      await completeStep(step.id);
      return;
    }

    if (step.action.startsWith('navigate:')) {
      const path = step.action.replace('navigate:', '');
      router.push(path);
      
      // Marcar como completado después de un breve delay
      setTimeout(() => {
        completeStep(step.id);
      }, 3000);
    }
  };

  const completeStep = async (stepId: string) => {
    try {
      const res = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_step',
          stepId
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProgress(updated);
        
        if (updated.percentageComplete === 100) {
          toast.success('¡Onboarding completado! 🎉', {
            description: 'Estás listo para usar INMOVA al 100%'
          });
          setTimeout(() => setIsVisible(false), 3000);
        } else {
          toast.success('Paso completado ✓');
        }
      }
    } catch (error) {
      logger.error('Error completing step:', error);
    }
  };

  const handleSkip = async () => {
    try {
      const res = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' })
      });

      if (res.ok) {
        toast.info('Onboarding omitido. Puedes retomarlo en cualquier momento.');
        setIsVisible(false);
      }
    } catch (error) {
      logger.error('Error skipping onboarding:', error);
    }
  };

  const handleRestart = async () => {
    try {
      const res = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(data);
        toast.success('Onboarding reiniciado');
      }
    } catch (error) {
      logger.error('Error restarting onboarding:', error);
    }
  };

  if (!progress || !isVisible) {
    return null;
  }

  // Validación: Si no hay steps o currentStep está fuera de rango
  if (!progress.steps || progress.steps.length === 0) {
    console.warn('SmartOnboardingWizard: No hay steps disponibles');
    return null;
  }

  // Asegurar que currentStep esté en rango válido
  const safeCurrentStep = Math.min(
    Math.max(0, progress.currentStep || 0),
    progress.steps.length - 1
  );

  const currentStepData = progress.steps[safeCurrentStep];

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] sm:max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg truncate">Bienvenido a INMOVA</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm truncate">
                  {progress.completedSteps}/{progress.totalSteps} pasos
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-xs shrink-0 h-8 px-2 sm:px-3"
            >
              Omitir
            </Button>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium">
                {progress.percentageComplete}%
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ~{progress.steps.reduce((acc, s) => acc + (s.estimatedTime || 0), 0)} min
              </span>
            </div>
            <Progress value={progress.percentageComplete} className="h-1.5 sm:h-2" />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 py-3 sm:py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {/* Paso actual destacado */}
          {currentStepData && !currentStepData.completed && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary rounded-lg flex-shrink-0">
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{currentStepData.title}</span>
                    {currentStepData.required && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        Requerido
                      </Badge>
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                    {currentStepData.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Button
                      onClick={() => {
                        handleStepClick(currentStepData);
                        setIsVisible(false);
                      }}
                      size="sm"
                      className="font-medium text-xs h-8 px-3"
                    >
                      Comenzar
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                    {currentStepData.videoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(currentStepData.videoUrl, '_blank')}
                        className="text-xs h-8 px-3"
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Video
                      </Button>
                    )}
                    {currentStepData.estimatedTime && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {currentStepData.estimatedTime}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de todos los pasos */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">
              Todos los pasos:
            </h4>
            {progress.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  if (!step.completed) {
                    handleStepClick(step);
                    setIsVisible(false);
                  }
                }}
                disabled={step.completed}
                className={`
                  w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all
                  ${step.completed
                    ? 'bg-muted/50 border-muted cursor-default opacity-70'
                    : index === safeCurrentStep
                    ? 'border-primary bg-primary/5 active:bg-primary/10'
                    : 'border-border active:border-primary/50 active:bg-accent'
                  }
                `}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  ) : (
                    <Circle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      index === safeCurrentStep ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={`text-xs sm:text-sm font-medium truncate ${
                      step.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {step.title}
                    </span>
                    {step.required && !step.completed && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 h-4 sm:h-5 px-1 sm:px-2">
                        Req.
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {step.estimatedTime && !step.completed && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {step.estimatedTime}m
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="text-muted-foreground h-8 sm:h-9 px-2 sm:px-3 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reiniciar</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 sm:h-9 px-4 sm:px-6 text-xs sm:text-sm font-medium"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

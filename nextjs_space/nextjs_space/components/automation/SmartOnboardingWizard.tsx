'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

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

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress || !isVisible) {
    return null;
  }

  const currentStepData = progress.steps[progress.currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Bienvenido a INMOVA</CardTitle>
                  <CardDescription>
                    Configuración {progress.vertical} - {progress.completedSteps}/{progress.totalSteps} pasos completados
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Omitir
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {progress.percentageComplete}% completado
                </span>
                <span className="text-sm text-muted-foreground">
                  ~{progress.steps.reduce((acc, s) => acc + (s.estimatedTime || 0), 0)} min restantes
                </span>
              </div>
              <Progress value={progress.percentageComplete} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            {/* Paso actual destacado */}
            {currentStepData && !currentStepData.completed && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Play className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {currentStepData.title}
                      {currentStepData.required && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Requerido
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {currentStepData.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleStepClick(currentStepData)}
                        size="sm"
                        className="font-medium"
                      >
                        Comenzar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      {currentStepData.videoUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(currentStepData.videoUrl, '_blank')}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Ver tutorial
                        </Button>
                      )}
                      {currentStepData.estimatedTime && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {currentStepData.estimatedTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Lista de todos los pasos */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Todos los pasos:
              </h4>
              {progress.steps.map((step, index) => (
                <motion.button
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !step.completed && handleStepClick(step)}
                  disabled={step.completed}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                    ${step.completed
                      ? 'bg-muted/50 border-muted cursor-default opacity-70'
                      : index === progress.currentStep
                      ? 'border-primary bg-primary/5 hover:bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className={`h-5 w-5 ${
                        index === progress.currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        step.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {step.title}
                      </span>
                      {step.required && !step.completed && (
                        <Badge variant="outline" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {step.estimatedTime && !step.completed && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.estimatedTime}m
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

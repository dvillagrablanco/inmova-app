'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Check, Play, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getOnboardingSteps, getModeloFromUserPreferences, type ModeloNegocio, type OnboardingStep } from '@/lib/onboarding-configs';
import { useSession } from 'next-auth/react';

interface OnboardingTourEnhancedProps {
  onComplete: () => void;
  modeloNegocio?: ModeloNegocio;
}

export function OnboardingTourEnhanced({ onComplete, modeloNegocio }: OnboardingTourEnhancedProps) {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  // Determinar modelo de negocio y cargar steps apropiados
  useEffect(() => {
    let modelo: ModeloNegocio = 'general';
    
    if (modeloNegocio) {
      modelo = modeloNegocio;
    } else if (session?.user) {
      modelo = getModeloFromUserPreferences(session.user);
    }
    
    const onboardingSteps = getOnboardingSteps(modelo);
    setSteps(onboardingSteps);
  }, [modeloNegocio, session]);

  if (steps.length === 0) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTour(false);
    onComplete();
  };

  const handleComplete = () => {
    setShowTour(false);
    // Guardar que usuario completó onboarding
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
    onComplete();
  };

  const handleAction = () => {
    if (step.action) {
      router.push(step.action.route);
      handleComplete();
    }
  };

  const handleWatchVideo = () => {
    if (step.videoUrl) {
      window.open(step.videoUrl, '_blank');
    }
  };

  const handleReadArticle = () => {
    if (step.helpArticle) {
      window.open(step.helpArticle, '_blank');
    }
  };

  if (!showTour) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-indigo-100 animate-fade-in">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 hover:bg-gray-100"
            onClick={handleSkip}
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-6xl mb-4 animate-bounce">{step.icon}</div>
          <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
          <Progress value={progress} className="mt-4" aria-label="Progreso del tour" />
          <p className="text-sm text-gray-500 mt-2">
            Paso {currentStep + 1} de {steps.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-base leading-relaxed">
            {step.description}
          </CardDescription>
          
          {/* Enlaces a recursos adicionales */}
          {(step.videoUrl || step.helpArticle) && (
            <div className="flex gap-2 mt-4">
              {step.videoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWatchVideo}
                  className="text-sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ver tutorial
                </Button>
              )}
              {step.helpArticle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReadArticle}
                  className="text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Leer guía
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            aria-label="Paso anterior"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Saltar tour
              </Button>
            )}
            {step.action && (
              <Button onClick={handleAction} className="gradient-primary shadow-primary">
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {!step.action && (
              <Button onClick={handleNext} className="gradient-primary shadow-primary">
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

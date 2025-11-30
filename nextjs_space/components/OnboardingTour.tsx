'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: { label: string; route: string };
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA! 👋',
    description: 'Te vamos a guiar en tus primeros pasos. Este tour te tomará solo 2 minutos y te ayudará a aprovechar al máximo todas las funcionalidades.',
    icon: '🎉'
  },
  {
    id: 'buildings',
    title: 'Paso 1: Crea tu primer edificio',
    description: 'Empieza registrando las propiedades que gestionas. Un edificio puede tener múltiples unidades (apartamentos, locales, etc.).',
    action: { label: 'Crear Edificio', route: '/edificios/nuevo' },
    icon: '🏢'
  },
  {
    id: 'units',
    title: 'Paso 2: Añade unidades',
    description: 'Registra los apartamentos, locales o habitaciones dentro de cada edificio. Cada unidad puede tener su propio contrato e inquilino.',
    action: { label: 'Ver Unidades', route: '/unidades' },
    icon: '🏠'
  },
  {
    id: 'tenants',
    title: 'Paso 3: Gestiona inquilinos',
    description: 'Añade los datos de tus inquilinos. Puedes vincularlos a contratos, ver su historial y comunicarte con ellos.',
    action: { label: 'Ver Inquilinos', route: '/inquilinos' },
    icon: '👥'
  },
  {
    id: 'dashboard',
    title: 'Tu Dashboard está listo',
    description: 'Desde el dashboard verás todos tus KPIs, alertas y métricas importantes. ¡También puedes explorar los 88 módulos disponibles!',
    action: { label: 'Ir al Dashboard', route: '/dashboard' },
    icon: '📊'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);
  const router = useRouter();

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
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
    onComplete();
  };

  const handleAction = () => {
    if (step.action) {
      router.push(step.action.route);
      handleComplete();
    }
  };

  if (!showTour) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-indigo-100">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 hover:bg-gray-100"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-6xl mb-4">{step.icon}</div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <Progress value={progress} className="mt-4" />
          <p className="text-sm text-gray-500 mt-2">
            Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
          </p>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {step.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <div className="flex gap-2">
            {currentStep < ONBOARDING_STEPS.length - 1 && (
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
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
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
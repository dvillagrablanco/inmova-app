'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    description:
      'Te vamos a guiar en tus primeros pasos. Este tour te tomará solo 2 minutos y te ayudará a aprovechar al máximo todas las funcionalidades.',
    icon: '🎉',
  },
  {
    id: 'buildings',
    title: 'Paso 1: Crea tu primer edificio',
    description:
      'Empieza registrando las propiedades que gestionas. Un edificio puede tener múltiples unidades (apartamentos, locales, etc.).',
    action: { label: 'Crear Edificio', route: '/edificios/nuevo' },
    icon: '🏢',
  },
  {
    id: 'units',
    title: 'Paso 2: Añade unidades',
    description:
      'Registra los apartamentos, locales o habitaciones dentro de cada edificio. Cada unidad puede tener su propio contrato e inquilino.',
    action: { label: 'Ver Unidades', route: '/unidades' },
    icon: '🏠',
  },
  {
    id: 'tenants',
    title: 'Paso 3: Gestiona inquilinos',
    description:
      'Añade los datos de tus inquilinos. Puedes vincularlos a contratos, ver su historial y comunicarte con ellos.',
    action: { label: 'Ver Inquilinos', route: '/inquilinos' },
    icon: '👥',
  },
  {
    id: 'dashboard',
    title: 'Tu Dashboard está listo',
    description:
      'Desde el dashboard verás todos tus KPIs, alertas y métricas importantes. ¡También puedes explorar los 88 módulos disponibles!',
    action: { label: 'Ir al Dashboard', route: '/dashboard' },
    icon: '📊',
  },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border-2 border-indigo-100">
        <CardHeader className="relative px-4 sm:px-6 pb-3 sm:pb-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 sm:right-4 sm:top-4 hover:bg-gray-100 h-9 w-9 sm:h-10 sm:w-10"
            onClick={handleSkip}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{step.icon}</div>
          <CardTitle className="text-lg sm:text-2xl pr-10">{step.title}</CardTitle>
          <Progress value={progress} className="mt-3 sm:mt-4 h-1.5 sm:h-2" />
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <CardDescription className="text-sm sm:text-base leading-relaxed">
            {step.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {currentStep < ONBOARDING_STEPS.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Saltar tour
              </Button>
            )}
            {step.action && (
              <Button
                onClick={handleAction}
                className="gradient-primary shadow-primary w-full sm:w-auto text-sm sm:text-base"
              >
                <span className="truncate">{step.action.label}</span>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            )}
            {!step.action && (
              <Button
                onClick={handleNext}
                className="gradient-primary shadow-primary w-full sm:w-auto text-sm sm:text-base"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Finalizar</span>
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
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

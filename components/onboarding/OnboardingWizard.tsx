'use client';

/**
 * Onboarding Wizard Component
 * Wizard guiado simplificado para nuevos usuarios
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Building2, Home, UserPlus, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Definición de pasos simplificados
interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  route?: string; // Ruta de navegación opcional
}

const STEP_CONFIGS: StepConfig[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA!',
    description: 'Tu plataforma de gestión inmobiliaria',
    icon: Sparkles,
  },
  {
    id: 'building',
    title: 'Crea tu primera propiedad',
    description: 'Solo necesitas la dirección para empezar',
    icon: Building2,
    route: '/edificios/nuevo',
  },
  {
    id: 'tenant',
    title: 'Añade un inquilino',
    description: 'Nombre y contacto, nada más',
    icon: UserPlus,
    route: '/inquilinos/nuevo',
  },
  {
    id: 'complete',
    title: '¡Ya puedes empezar!',
    description: 'Explora el dashboard cuando quieras',
    icon: CheckCircle2,
    route: '/dashboard',
  },
];

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const stepConfig = STEP_CONFIGS[currentStep];
  const progress = ((currentStep + 1) / STEP_CONFIGS.length) * 100;
  const Icon = stepConfig.icon;
  const isLastStep = currentStep === STEP_CONFIGS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Guardar que se saltó el tutorial
    try {
      await fetch('/api/onboarding/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedTasks: [], setupVersion: 'skipped' })
      });
    } catch (e) {
      // Ignorar errores de API
    }
    onClose();
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completedTasks: STEP_CONFIGS.map(s => s.id), 
          setupVersion: '1.0' 
        })
      });
    } catch (e) {
      // Ignorar errores de API
    }
    toast.success('¡Bienvenido! Ya puedes empezar');
    onComplete();
    onClose();
  };

  const handleActionClick = () => {
    if (stepConfig.route) {
      router.push(stepConfig.route);
      toast.info('Vamos a esa sección');
      // Auto-avanzar al siguiente paso después de un breve delay
      setTimeout(() => {
        if (!isLastStep) {
          setCurrentStep(prev => prev + 1);
        }
      }, 500);
    }
  };

  // Contenido simplificado para cada paso
  const renderStepContent = () => {
    switch (stepConfig.id) {
      case 'welcome':
        return (
          <div className="space-y-4 text-center">
            <p className="text-gray-600 text-lg">
              Gestiona propiedades, inquilinos y contratos en un solo lugar.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Este tutorial es muy rápido:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Solo 3 pasos</li>
                <li>✓ Menos de 1 minuto</li>
                <li>✓ Puedes saltarlo si quieres</li>
              </ul>
            </div>
          </div>
        );

      case 'building':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Una propiedad puede ser un piso, casa, local o cualquier inmueble.
            </p>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Tip:</strong> Solo necesitas poner la dirección. Todo lo demás es opcional.
              </p>
            </div>
            {stepConfig.route && (
              <Button onClick={handleActionClick} className="w-full" size="lg">
                <Building2 className="h-5 w-5 mr-2" />
                Crear mi primera propiedad
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        );

      case 'tenant':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Registra a tus inquilinos para llevar el control de contratos y pagos.
            </p>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Tip:</strong> Con el nombre y email es suficiente para empezar.
              </p>
            </div>
            {stepConfig.route && (
              <Button onClick={handleActionClick} className="w-full" size="lg">
                <UserPlus className="h-5 w-5 mr-2" />
                Añadir inquilino
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 text-lg">
              ¡Listo! Ya puedes explorar todas las funciones.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                <strong>¿Necesitas ayuda?</strong> Usa el botón de ayuda en la esquina inferior derecha.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                isLastStep ? "bg-green-100" : "bg-blue-100"
              )}>
                <Icon className={cn(
                  "h-6 w-6",
                  isLastStep ? "text-green-600" : "text-blue-600"
                )} />
              </div>
              <div>
                <DialogTitle>{stepConfig.title}</DialogTitle>
                <DialogDescription>{stepConfig.description}</DialogDescription>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Paso {currentStep + 1} de {STEP_CONFIGS.length}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Anterior
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} className="text-gray-500">
              Saltar
            </Button>
          </div>
          <Button
            onClick={handleNext}
            className={cn(
              isLastStep && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isLastStep ? '¡Empezar!' : 'Siguiente'}
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {STEP_CONFIGS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep
                  ? "w-8 bg-blue-600"
                  : index < currentStep
                  ? "w-2 bg-green-500"
                  : "w-2 bg-gray-300"
              )}
              aria-label={`Ir al paso ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

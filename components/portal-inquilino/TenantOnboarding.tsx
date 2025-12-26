'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
}

interface TenantOnboardingProps {
  tenantId: string;
  tenantName: string;
}

export function TenantOnboarding({ tenantId, tenantName }: TenantOnboardingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'bienvenida',
      title: '¡Bienvenido a tu Portal!',
      description: 'Te damos la bienvenida a tu espacio personal',
      icon: Home,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Hola {tenantName} 👋</h3>
          <p className="text-muted-foreground">
            Este es tu portal personal donde podrás gestionar todo lo relacionado con tu vivienda de
            forma fácil y rápida.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800">
              💡 <strong>Consejo:</strong> Guarda este enlace en tus favoritos para acceder
              rápidamente en el futuro.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'contratos',
      title: 'Contratos y Documentos',
      description: 'Accede a tus contratos en cualquier momento',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-center">Contratos y Documentos</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Consulta los detalles de tu contrato de arrendamiento</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Descarga documentos importantes cuando los necesites</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Revisa las fechas de inicio y finalización de tu contrato</span>
            </li>
          </ul>
          <Card className="p-3 bg-gray-50 border-gray-200">
            <p className="text-xs text-gray-600">
              Encontrarás esta sección en el menú principal con el ícono de{' '}
              <FileText className="inline w-4 h-4" />
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'pagos',
      title: 'Pagos y Facturas',
      description: 'Gestiona tus pagos de forma sencilla',
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-center">Pagos y Facturas</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Consulta el estado de tus pagos de renta</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Ve el historial completo de pagos realizados</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Descarga recibos y comprobantes de pago</span>
            </li>
          </ul>
          <Card className="p-3 bg-gray-50 border-gray-200">
            <p className="text-xs text-gray-600">
              Accede a Pagos desde el menú con el ícono <CreditCard className="inline w-4 h-4" />
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'mantenimiento',
      title: 'Solicitudes de Mantenimiento',
      description: 'Reporta incidencias rápidamente',
      icon: Wrench,
      content: (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-center">Mantenimiento</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Reporta problemas o averías en tu vivienda</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Sigue el estado de tus solicitudes en tiempo real</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Recibe notificaciones sobre el progreso</span>
            </li>
          </ul>
          <Card className="p-3 bg-orange-50 border-orange-200">
            <p className="text-xs text-orange-800 font-medium">
              ⚠️ Para emergencias, contacta directamente con el administrador
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'finalizar',
      title: '¡Todo Listo!',
      description: 'Ya puedes empezar a usar tu portal',
      icon: CheckCircle,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold">¡Perfecto!</h3>
          <p className="text-muted-foreground">
            Ahora estás listo para aprovechar al máximo tu portal del inquilino.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">¿Necesitas ayuda?</p>
            <p className="text-xs text-muted-foreground">
              Si tienes alguna duda, puedes contactar con tu administrador a través de la sección de
              mensajes.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Verificar si debe mostrar el onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/portal-inquilino/onboarding');
        if (response.ok) {
          const data = await response.json();
          if (!data.completed) {
            setCurrentStep(data.currentStep || 0);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error('Error al verificar onboarding:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      updateProgress(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      updateProgress(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/portal-inquilino/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      setOpen(false);
      toast.success('¡Bienvenido a tu portal!');
      router.refresh();
    } catch (error) {
      console.error('Error al completar onboarding:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/portal-inquilino/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      setOpen(false);
    } catch (error) {
      console.error('Error al saltar onboarding:', error);
    }
  };

  const updateProgress = async (step: number) => {
    try {
      await fetch('/api/portal-inquilino/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStep: step }),
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-2xl">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl">{currentStepData?.title}</DialogTitle>
          <DialogDescription>{currentStepData?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Paso {currentStep + 1} de {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Contenido del paso actual */}
          <div className="py-6">{currentStepData?.content}</div>

          {/* Botones de navegación */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Comenzar
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Botón para saltar */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar introducción
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

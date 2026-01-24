'use client';

/**
 * WIZARD DE BIENVENIDA SIMPLIFICADO
 * Para usuarios no técnicos - máxima intuitividad
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Home, 
  Building2, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  action?: string;
  benefits: string[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a tu nueva herramienta!',
    subtitle: 'Gestión inmobiliaria simplificada',
    description: 'Vamos a configurar tu espacio en unos sencillos pasos. Te tomará menos de 2 minutos.',
    icon: Sparkles,
    benefits: [
      'Sin instalaciones complicadas',
      'Sin configuración técnica',
      'Listo para usar en minutos'
    ]
  },
  {
    id: 'properties',
    title: 'Tus propiedades en un solo lugar',
    subtitle: 'Organiza edificios, pisos y locales',
    description: 'Aquí guardarás toda la información de tus inmuebles: direcciones, fotos, documentos.',
    icon: Building2,
    action: '/edificios',
    benefits: [
      'Fotos y documentos organizados',
      'Información siempre accesible',
      'Busca cualquier dato en segundos'
    ]
  },
  {
    id: 'tenants',
    title: 'Tus inquilinos y contactos',
    subtitle: 'Toda la información de tus arrendatarios',
    description: 'Datos de contacto, contratos y pagos de cada inquilino en un solo sitio.',
    icon: Users,
    action: '/inquilinos',
    benefits: [
      'Comunicación directa desde la app',
      'Historial de pagos visible',
      'Contratos siempre a mano'
    ]
  },
  {
    id: 'communication',
    title: 'Comunicación fácil y rápida',
    subtitle: 'Chat, notificaciones y recordatorios',
    description: 'Mantente conectado con inquilinos, proveedores y tu equipo sin salir de la aplicación.',
    icon: MessageSquare,
    action: '/chat',
    benefits: [
      'Todo en un solo lugar',
      'Sin perder mensajes importantes',
      'Respuestas automáticas para tareas comunes'
    ]
  },
  {
    id: 'complete',
    title: '¡Todo listo! Ya puedes empezar',
    subtitle: 'Tu espacio está configurado',
    description: 'Hemos preparado tu panel principal. Explora libremente, siempre podrás volver aquí desde el menú.',
    icon: CheckCircle,
    benefits: [
      'Empieza con lo básico',
      'Activa más funciones cuando las necesites',
      'Ayuda disponible en todo momento'
    ]
  }
];

export function WelcomeWizard({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  const step = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsClosing(true);
    try {
      await fetch('/api/onboarding/skip', { method: 'POST' });
      onComplete?.();
    } catch (error) {
      console.error('Error skipping wizard:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' });
      toast.success('¡Configuración completada! Bienvenido');
      onComplete?.();
    } catch (error) {
      console.error('Error completing wizard:', error);
      toast.error('Error al completar. Intenta de nuevo');
    }
  };

  const handleExploreNow = () => {
    if (step.action) {
      router.push(step.action);
      toast.info(`Explorando: ${step.subtitle}`);
    }
  };

  if (isClosing) return null;

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl my-auto"
        >
          <Card className="w-full bg-white shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
              {/* Close button - Always visible at top right for mobile */}
              <div className="flex justify-end mb-2 sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 -mr-2"
                >
                  <X size={20} />
                  <span className="ml-1 text-sm">Cerrar</span>
                </Button>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{step.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{step.subtitle}</p>
                  </div>
                </div>
                {/* Desktop close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 hidden sm:flex flex-shrink-0"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Paso {currentStep + 1} de {WIZARD_STEPS.length}</span>
                  <span className="font-medium text-indigo-600">{Math.round(progress)}% completado</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {/* Description */}
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {step.description}
              </p>

              {/* Benefits */}
              <div className="bg-indigo-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <p className="text-sm font-semibold text-indigo-900">¿Qué puedes hacer aquí?</p>
                <ul className="space-y-2">
                  {step.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button (if step has one) */}
              {step.action && currentStep !== WIZARD_STEPS.length - 1 && (
                <Button
                  onClick={handleExploreNow}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ver esta sección ahora
                </Button>
              )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-3 sm:p-6 border-t bg-gray-50 flex-shrink-0">
              {/* Mobile: Stack buttons vertically for better touch targets */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                {/* Navigation buttons */}
                <div className="flex items-center justify-between sm:justify-start order-2 sm:order-1">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="text-gray-600"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">Atrás</span>
                  </Button>
                  
                  {/* Mobile skip button inline */}
                  {currentStep !== WIZARD_STEPS.length - 1 && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-gray-600 sm:hidden"
                      size="sm"
                    >
                      Saltar
                    </Button>
                  )}
                </div>

                {/* Main action buttons */}
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  {currentStep !== WIZARD_STEPS.length - 1 && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-gray-600 hidden sm:flex"
                    >
                      Saltar tutorial
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex-1 sm:flex-none"
                  >
                    {currentStep === WIZARD_STEPS.length - 1 ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        ¡Empezar!
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
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

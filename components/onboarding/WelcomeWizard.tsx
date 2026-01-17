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
      await fetch('/api/onboarding/complete-setup', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedTasks: [], setupVersion: 'skipped' })
      });
      onComplete?.();
    } catch (error) {
      console.error('Error skipping wizard:', error);
      // Permitir cerrar incluso si falla la API
      onComplete?.();
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete-setup', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completedTasks: WIZARD_STEPS.map(s => s.id), 
          setupVersion: '1.0' 
        })
      });
      toast.success('¡Configuración completada! Bienvenido');
      onComplete?.();
    } catch (error) {
      console.error('Error completing wizard:', error);
      // Permitir completar incluso si falla la API
      toast.success('¡Bienvenido! Ya puedes empezar');
      onComplete?.();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{step.subtitle}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Paso {currentStep + 1} de {WIZARD_STEPS.length}</span>
                  <span className="font-medium text-indigo-600">{Math.round(progress)}% completado</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <p className="text-lg text-gray-700 leading-relaxed">
                {step.description}
              </p>

              {/* Benefits */}
              <div className="bg-indigo-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-indigo-900">¿Qué puedes hacer aquí?</p>
                <ul className="space-y-2">
                  {step.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
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

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {currentStep !== WIZARD_STEPS.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-gray-600"
                  >
                    Saltar tutorial
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

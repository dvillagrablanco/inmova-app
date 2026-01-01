'use client';

/**
 * WIZARD DE CONFIGURACIÓN INICIAL
 * Guía completa paso a paso para usuarios nuevos
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Users,
  FileText,
  Settings,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Play,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SetupStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  estimatedTime: number; // minutos
  tasks: {
    id: string;
    title: string;
    description: string;
    action: string; // Acción específica
    route?: string; // Ruta donde realizar la acción
  }[];
  benefits: string[];
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'profile',
    title: 'Tu Perfil',
    subtitle: 'Completa tu información básica',
    description: 'Necesitamos algunos datos para personalizar tu experiencia.',
    icon: Users,
    estimatedTime: 2,
    tasks: [
      {
        id: 'name',
        title: 'Nombre completo',
        description: 'Tu nombre como aparecerá en contratos y comunicaciones',
        action: 'Introduce tu nombre completo',
        route: '/configuracion'
      },
      {
        id: 'phone',
        title: 'Teléfono de contacto',
        description: 'Para notificaciones urgentes',
        action: 'Añade tu número de teléfono',
        route: '/configuracion'
      },
      {
        id: 'address',
        title: 'Dirección',
        description: 'Tu dirección fiscal (opcional)',
        action: 'Completa tu dirección',
        route: '/configuracion'
      }
    ],
    benefits: [
      'Contratos con tu información correcta',
      'Notificaciones al instante',
      'Documentos oficiales listos'
    ]
  },
  {
    id: 'properties',
    title: 'Primera Propiedad',
    subtitle: 'Añade tu primer inmueble',
    description: 'Empecemos añadiendo una propiedad que gestionas.',
    icon: Building2,
    estimatedTime: 5,
    tasks: [
      {
        id: 'create-building',
        title: 'Crear edificio',
        description: 'Añade un edificio o propiedad',
        action: 'Click en "Nuevo Edificio"',
        route: '/edificios'
      },
      {
        id: 'address-details',
        title: 'Dirección completa',
        description: 'Calle, número, código postal, ciudad',
        action: 'Rellena la dirección del inmueble'
      },
      {
        id: 'property-details',
        title: 'Detalles de la propiedad',
        description: 'Metros cuadrados, habitaciones, baños',
        action: 'Completa las características'
      },
      {
        id: 'upload-photo',
        title: 'Sube una foto',
        description: 'Foto de la fachada o interior',
        action: 'Arrastra una foto o haz click para subir'
      }
    ],
    benefits: [
      'Toda la información en un lugar',
      'Fácil de compartir con inquilinos',
      'Base para contratos y pagos'
    ]
  },
  {
    id: 'tenant',
    title: 'Primer Inquilino',
    subtitle: 'Registra a tu primer arrendatario',
    description: 'Añade información de la persona que alquila la propiedad.',
    icon: Users,
    estimatedTime: 3,
    tasks: [
      {
        id: 'tenant-info',
        title: 'Datos del inquilino',
        description: 'Nombre, DNI, teléfono, email',
        action: 'Click en "Nuevo Inquilino" y rellena',
        route: '/inquilinos'
      },
      {
        id: 'assign-property',
        title: 'Asignar propiedad',
        description: 'Vincular inquilino con la propiedad',
        action: 'Selecciona la propiedad que alquila'
      },
      {
        id: 'emergency-contact',
        title: 'Contacto de emergencia',
        description: 'Persona de contacto alternativa',
        action: 'Añade un contacto de emergencia (opcional)'
      }
    ],
    benefits: [
      'Comunicación directa desde la app',
      'Historial completo en un lugar',
      'Envío de notificaciones automáticas'
    ]
  },
  {
    id: 'contract',
    title: 'Primer Contrato',
    subtitle: 'Crea tu primer contrato de alquiler',
    description: 'Genera un contrato legal desde una plantilla predefinida.',
    icon: FileText,
    estimatedTime: 7,
    tasks: [
      {
        id: 'select-template',
        title: 'Elegir plantilla',
        description: 'Contrato estándar de alquiler',
        action: 'Selecciona "Contrato de Alquiler Estándar"',
        route: '/contratos'
      },
      {
        id: 'fill-terms',
        title: 'Términos del contrato',
        description: 'Precio, duración, fianza',
        action: 'Rellena precio mensual, fecha inicio y fianza'
      },
      {
        id: 'review-contract',
        title: 'Revisar contrato',
        description: 'Verifica que todo esté correcto',
        action: 'Lee el contrato generado'
      },
      {
        id: 'send-for-signature',
        title: 'Enviar para firmar',
        description: 'Firma digital para ti y el inquilino',
        action: 'Click en "Enviar para Firma Digital"'
      }
    ],
    benefits: [
      'Contrato legal en minutos',
      'Firma digital válida',
      'Todo almacenado de forma segura'
    ]
  },
  {
    id: 'preferences',
    title: 'Personalizar Experiencia',
    subtitle: 'Ajusta la app a tu nivel',
    description: 'Configura las ayudas y funciones según tu experiencia.',
    icon: Settings,
    estimatedTime: 2,
    tasks: [
      {
        id: 'set-level',
        title: 'Nivel de experiencia',
        description: 'Principiante, Intermedio o Avanzado',
        action: 'Selecciona tu nivel de experiencia',
        route: '/configuracion'
      },
      {
        id: 'enable-helps',
        title: 'Activar ayudas',
        description: 'Tooltips, videos, asistente virtual',
        action: 'Activa las ayudas que necesites'
      },
      {
        id: 'select-modules',
        title: 'Funciones activas',
        description: 'Solo activa lo que uses',
        action: 'Revisa las funciones en "Funciones"'
      }
    ],
    benefits: [
      'App adaptada a ti',
      'Solo ves lo que necesitas',
      'Puedes cambiar cuando quieras'
    ]
  }
];

interface FirstTimeSetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function FirstTimeSetupWizard({ onComplete, onSkip }: FirstTimeSetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const currentStep = SETUP_STEPS[currentStepIndex];
  const totalTasks = SETUP_STEPS.reduce((acc, step) => acc + step.tasks.length, 0);
  const progress = (completedTasks.length / totalTasks) * 100;
  const isLastStep = currentStepIndex === SETUP_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    setCurrentStepIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedTasks,
          setupVersion: '1.0'
        })
      });
    } catch (error) {
      console.error('Error completing setup:', error);
    }

    onComplete();
  };

  const handleStartTask = (task: any) => {
    if (task.route) {
      router.push(task.route);
    }
    setIsExpanded(true);
  };

  const toggleTaskCompletion = (taskId: string) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  const Icon = currentStep.icon;
  const completedInStep = currentStep.tasks.filter(t => completedTasks.includes(t.id)).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Card className="bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Configuración Inicial</h2>
                  <p className="text-indigo-100 text-sm">5 pasos para empezar</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Paso {currentStepIndex + 1}/{SETUP_STEPS.length}
              </Badge>
            </div>

            {/* Progress global */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso total</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-indigo-400" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Título del paso */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{currentStep.title}</h3>
                    <p className="text-lg text-gray-600 mt-1">{currentStep.subtitle}</p>
                    <p className="text-gray-500 mt-2">{currentStep.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{currentStep.estimatedTime} min</span>
                  </div>
                </div>

                {/* Lista de tareas */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Tareas a completar</h4>
                    <span className="text-sm text-gray-600">
                      {completedInStep}/{currentStep.tasks.length} completadas
                    </span>
                  </div>

                  {currentStep.tasks.map((task, index) => {
                    const isCompleted = completedTasks.includes(task.id);

                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-lg p-4 border-2 transition-all ${
                          isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-900">{task.title}</h5>
                              {task.route && !isCompleted && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartTask(task)}
                                  className="text-indigo-600"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Iniciar
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            {!isCompleted && (
                              <div className="mt-2 bg-indigo-50 rounded p-2">
                                <p className="text-xs text-indigo-700">
                                  <strong>Acción:</strong> {task.action}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Beneficios */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-3">¿Por qué hacer esto?</h4>
                  <ul className="space-y-2">
                    {currentStep.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-indigo-700">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onSkip && (
                <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                  Saltar configuración
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={completedInStep === 0}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar Configuración
                  </>
                ) : (
                  <>
                    Siguiente Paso
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

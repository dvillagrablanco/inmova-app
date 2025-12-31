'use client';

/**
 * Sistema de Onboarding Adaptativo por Perfil de Usuario
 * 
 * Features:
 * - Detecta perfil del usuario (rol + experiencia + tech savviness)
 * - Adapta contenido, duración y complejidad del onboarding
 * - Progreso gamificado con badges
 * - Skip inteligente para usuarios avanzados
 * - Tutoriales interactivos con hints contextuales
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Trophy,
  Star,
  Zap,
  Book,
  Play,
  Sparkles,
  Target,
  Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import { getOnboardingConfig, needsExtraHelp } from '@/lib/user-profiles-config';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  video?: string; // URL del video tutorial
  estimatedTime: string; // "2 min", "5 min"
  importance: 'critical' | 'recommended' | 'optional';
}

interface OnboardingProps {
  onComplete?: () => void;
}

export function AdaptiveOnboarding({ onComplete }: OnboardingProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Detectar si el usuario necesita onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch('/api/user/onboarding-status');
        const data = await res.json();

        if (!data.completed) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [session?.user?.id]);

  // Obtener configuración de onboarding según perfil
  const getStepsForProfile = (): OnboardingStep[] => {
    if (!session?.user) return [];

    const userProfile = {
      role: (session.user as any).role || 'gestor',
      experienceLevel: (session.user as any).experienceLevel || 'principiante',
      techSavviness: (session.user as any).techSavviness || 'medio',
    };

    const config = getOnboardingConfig(userProfile);
    const needsHelp = needsExtraHelp(userProfile);

    // Pasos base para todos
    const baseSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: '¡Bienvenido a Inmova! 🎉',
        description: 'Vamos a configurar tu cuenta en pocos minutos',
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">
              Hemos detectado que eres <strong>{userProfile.role}</strong> con nivel{' '}
              <strong>{userProfile.experienceLevel}</strong>.
            </p>
            <p className="text-gray-600">
              Hemos personalizado este tutorial especialmente para ti. Duración estimada:{' '}
              <strong>{config?.duration === 'short' ? '5 min' : config?.duration === 'medium' ? '15 min' : '20 min'}</strong>
            </p>
            {needsHelp && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Ayuda extra disponible</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Como eres nuevo, tendrás acceso a tutoriales interactivos, videos y chat de soporte 24/7
                  </p>
                </div>
              </div>
            )}
          </div>
        ),
        estimatedTime: '1 min',
        importance: 'critical',
      },
    ];

    // Pasos según el rol
    if (userProfile.role === 'administrador' || userProfile.role === 'super_admin') {
      baseSteps.push(
        {
          id: 'company_setup',
          title: 'Configuración de Empresa',
          description: 'Completa la información de tu empresa',
          content: (
            <div className="space-y-4">
              <p className="text-gray-600">
                Configura los datos básicos de tu empresa: nombre, logo, datos fiscales.
              </p>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Por qué es importante?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Aparecerá en todos los documentos y contratos</li>
                    <li>Se mostrará en el portal de inquilinos</li>
                    <li>Permitirá facturación automática correcta</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ),
          action: {
            label: 'Configurar Empresa',
            href: '/admin/configuracion',
          },
          video: 'https://www.youtube.com/embed/example1',
          estimatedTime: '5 min',
          importance: 'critical',
        },
        {
          id: 'add_users',
          title: 'Invita a tu Equipo',
          description: 'Agrega usuarios y asigna permisos',
          content: (
            <div className="space-y-4">
              <p className="text-gray-600">
                Invita a gestores, operadores o personal de soporte.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gestor</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-600">
                    Gestión de propiedades e inquilinos
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Operador</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-600">
                    Mantenimiento y tareas de campo
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Soporte</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-600">
                    Atención a inquilinos
                  </CardContent>
                </Card>
              </div>
            </div>
          ),
          action: {
            label: 'Gestionar Usuarios',
            href: '/admin/usuarios',
          },
          estimatedTime: '3 min',
          importance: 'recommended',
        }
      );
    }

    if (userProfile.role === 'gestor' || userProfile.role === 'administrador') {
      baseSteps.push(
        {
          id: 'add_property',
          title: 'Agrega tu Primera Propiedad',
          description: 'Crea un edificio y sus unidades',
          content: (
            <div className="space-y-4">
              <p className="text-gray-600">
                El sistema está organizado en <strong>Edificios</strong> → <strong>Unidades</strong> → <strong>Contratos</strong>
              </p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-900 mb-2">💡 Tip para empezar rápido:</p>
                <p className="text-sm text-indigo-700">
                  Puedes generar <strong>datos de ejemplo</strong> automáticamente para explorar la plataforma sin configurar manualmente.
                </p>
              </div>
            </div>
          ),
          action: {
            label: 'Crear Edificio',
            href: '/edificios',
          },
          estimatedTime: '5 min',
          importance: 'critical',
        },
        {
          id: 'add_tenant',
          title: 'Registra un Inquilino',
          description: 'Agrega inquilinos y crea contratos',
          content: (
            <div className="space-y-4">
              <p className="text-gray-600">
                Registra la información del inquilino y vincula un contrato a una unidad.
              </p>
              {needsHelp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    📹 <strong>Video tutorial disponible</strong> - Te mostramos paso a paso cómo hacerlo
                  </p>
                </div>
              )}
            </div>
          ),
          action: {
            label: 'Agregar Inquilino',
            href: '/inquilinos',
          },
          video: needsHelp ? 'https://www.youtube.com/embed/example2' : undefined,
          estimatedTime: '4 min',
          importance: 'critical',
        }
      );
    }

    if (userProfile.role === 'operador') {
      baseSteps.push(
        {
          id: 'mobile_app',
          title: 'Configura tu Móvil',
          description: 'Instala la app móvil para trabajo de campo',
          content: (
            <div className="space-y-4">
              <p className="text-gray-600">
                Como operador, trabajarás principalmente desde el móvil.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">📱</span>
                    <span className="text-xs">iOS</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">🤖</span>
                    <span className="text-xs">Android</span>
                  </div>
                </Button>
              </div>
            </div>
          ),
          estimatedTime: '2 min',
          importance: 'recommended',
        }
      );
    }

    // Paso final para todos
    baseSteps.push({
      id: 'complete',
      title: '¡Todo Listo! 🎉',
      description: 'Ya puedes empezar a usar Inmova',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Felicitaciones!</h3>
            <p className="text-gray-600">Has completado el onboarding exitosamente</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-yellow-900">Primera Configuración</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-blue-900">Inicio Rápido</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Rocket className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-green-900">Listo para Usar</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximos Pasos Recomendados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Explora el dashboard principal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Activa los módulos que necesites</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Consulta la base de conocimientos</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      estimatedTime: '1 min',
      importance: 'critical',
    });

    return baseSteps;
  };

  const steps = getStepsForProfile();
  const currentStepData = steps[currentStep];
  const progress = ((completedSteps.length) / steps.length) * 100;

  const handleNext = () => {
    if (currentStepData && !completedSteps.includes(currentStepData.id)) {
      setCompletedSteps([...completedSteps, currentStepData.id]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      await fetch('/api/user/skip-onboarding', {
        method: 'POST',
      });
      setIsOpen(false);
      toast.success('Onboarding omitido. Puedes volver a verlo desde Ayuda.');
    } catch (error) {
      toast.error('Error al omitir onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
      });
      setIsOpen(false);
      toast.success('¡Onboarding completado! Bienvenido a Inmova 🎉');
      onComplete?.();
    } catch (error) {
      toast.error('Error al completar onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (!currentStepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {currentStepData.description}
              </DialogDescription>
            </div>
            <Badge variant={currentStepData.importance === 'critical' ? 'destructive' : 'secondary'}>
              {currentStepData.importance === 'critical' ? 'Obligatorio' : currentStepData.importance === 'recommended' ? 'Recomendado' : 'Opcional'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="py-6">
          {currentStepData.video && (
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src={currentStepData.video}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {currentStepData.content}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
            {currentStepData.importance !== 'critical' && (
              <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                Omitir Tutorial
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStepData.action && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStepData.action?.href) {
                    window.open(currentStepData.action.href, '_blank');
                  }
                  currentStepData.action?.onClick?.();
                }}
              >
                {currentStepData.action.label}
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading}>
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pt-4 border-t">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary w-8'
                  : completedSteps.includes(step.id)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              aria-label={`Ir al paso ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

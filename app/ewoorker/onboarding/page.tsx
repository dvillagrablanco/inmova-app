'use client';

/**
 * Página de Onboarding Guiado eWoorker
 * Wizard paso a paso para completar el perfil y empezar
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  MapPin,
  Bell,
  CreditCard,
  Rocket,
  Wrench,
  Users,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  estimatedMinutes: number;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: OnboardingStep[];
  canPublishObras: boolean;
  canMakeOfertas: boolean;
  profileCompleteness: number;
  nextAction: {
    step: string;
    url: string;
    cta: string;
  } | null;
}

const stepIcons: Record<string, React.ReactNode> = {
  WELCOME: <Users className="h-6 w-6" />,
  USER_TYPE: <Building2 className="h-6 w-6" />,
  COMPANY_PROFILE: <Building2 className="h-6 w-6" />,
  SPECIALTIES: <Wrench className="h-6 w-6" />,
  DOCUMENTS_REA: <FileText className="h-6 w-6" />,
  DOCUMENTS_INSURANCE: <FileText className="h-6 w-6" />,
  ZONES: <MapPin className="h-6 w-6" />,
  PLAN_SELECTION: <CreditCard className="h-6 w-6" />,
  FIRST_ACTION: <Rocket className="h-6 w-6" />,
  NOTIFICATIONS: <Bell className="h-6 w-6" />,
};

export default function EwoorkerOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/ewoorker/onboarding/progress');
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);

        // Encontrar el primer paso no completado
        const firstIncomplete = data.progress.steps.findIndex(
          (s: OnboardingStep) => !s.completed && !s.skipped
        );
        setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Error cargando progreso');
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string, data?: Record<string, any>) => {
    setCompleting(true);
    try {
      const res = await fetch('/api/ewoorker/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, data }),
      });

      if (res.ok) {
        const result = await res.json();
        setProgress(result.progress);
        toast.success('¡Paso completado!');

        // Avanzar al siguiente paso
        if (result.nextStep) {
          const nextIndex = progress?.steps.findIndex((s) => s.id === result.nextStep);
          if (nextIndex !== undefined && nextIndex >= 0) {
            setCurrentStepIndex(nextIndex);
          }
        } else {
          // Onboarding completado
          toast.success('🎉 ¡Onboarding completado! Ya puedes usar eWoorker.');
          router.push('/ewoorker/dashboard');
        }
      } else {
        toast.error('Error completando paso');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Error de conexión');
    } finally {
      setCompleting(false);
    }
  };

  const handleStepAction = () => {
    if (!progress) return;

    const currentStep = progress.steps[currentStepIndex];

    switch (currentStep.id) {
      case 'WELCOME':
        completeStep('WELCOME');
        break;
      case 'USER_TYPE':
        // Mostrar selector de tipo
        completeStep('USER_TYPE', { userType: 'AMBOS' });
        break;
      case 'COMPANY_PROFILE':
        router.push('/ewoorker/perfil?onboarding=true');
        break;
      case 'SPECIALTIES':
        router.push('/ewoorker/onboarding/specialties');
        break;
      case 'DOCUMENTS_REA':
      case 'DOCUMENTS_INSURANCE':
        router.push('/ewoorker/compliance');
        break;
      case 'ZONES':
        router.push('/ewoorker/onboarding/zones');
        break;
      case 'PLAN_SELECTION':
        router.push('/ewoorker/pagos');
        break;
      case 'FIRST_ACTION':
        router.push('/ewoorker/obras/nueva');
        break;
      case 'NOTIFICATIONS':
        completeStep('NOTIFICATIONS');
        break;
      default:
        completeStep(currentStep.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-gray-500">No se encontró información de onboarding</p>
        <Button onClick={() => router.push('/ewoorker/registro')} className="mt-4">
          Registrarse en eWoorker
        </Button>
      </div>
    );
  }

  const currentStep = progress.steps[currentStepIndex];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido a eWoorker</h1>
        <p className="text-gray-600">Completa estos pasos para empezar a usar la plataforma</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso</span>
          <span>{progress.percentage}% completado</span>
        </div>
        <Progress value={progress.percentage} className="h-3" />
      </div>

      {/* Steps Overview */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
        {progress.steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStepIndex(index)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              index === currentStepIndex
                ? 'border-blue-500 bg-blue-50'
                : step.completed
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-xs whitespace-nowrap">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Current Step Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${currentStep.completed ? 'bg-green-100' : 'bg-blue-100'}`}
            >
              {stepIcons[currentStep.id] || <Circle className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>{currentStep.title}</CardTitle>
                {currentStep.required && (
                  <Badge variant="destructive" className="text-xs">
                    Obligatorio
                  </Badge>
                )}
                {currentStep.completed && (
                  <Badge variant="default" className="bg-green-600 text-xs">
                    Completado
                  </Badge>
                )}
              </div>
              <CardDescription>{currentStep.description}</CardDescription>
            </div>
            <div className="text-sm text-gray-500">~{currentStep.estimatedMinutes} min</div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Contenido específico por paso */}
          {currentStep.id === 'WELCOME' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                eWoorker es el marketplace de subcontratación en construcción que conecta empresas
                constructoras con subcontratistas verificados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">🏗️</div>
                  <p className="font-medium">Publica Obras</p>
                  <p className="text-sm text-gray-600">
                    Encuentra subcontratistas para tus proyectos
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">👷</div>
                  <p className="font-medium">Ofrece Servicios</p>
                  <p className="text-sm text-gray-600">
                    Recibe ofertas de trabajo de constructoras
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="font-medium">Cumple la Ley</p>
                  <p className="text-sm text-gray-600">
                    Libro de subcontratación automático (Ley 32/2006)
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'USER_TYPE' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">¿Cómo vas a usar eWoorker principalmente?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => completeStep('USER_TYPE', { userType: 'CONTRATISTA' })}
                  className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <p className="font-medium">Contratista</p>
                  <p className="text-sm text-gray-600">Publico obras y busco subcontratistas</p>
                </button>
                <button
                  onClick={() => completeStep('USER_TYPE', { userType: 'SUBCONTRATISTA' })}
                  className="p-4 border-2 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">🔧</div>
                  <p className="font-medium">Subcontratista</p>
                  <p className="text-sm text-gray-600">Ofrezco mis servicios a constructoras</p>
                </button>
                <button
                  onClick={() => completeStep('USER_TYPE', { userType: 'AMBOS' })}
                  className="p-4 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <p className="font-medium">Ambos</p>
                  <p className="text-sm text-gray-600">Publico obras y también ofrezco servicios</p>
                </button>
              </div>
            </div>
          )}

          {currentStep.id === 'NOTIFICATIONS' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Activa las notificaciones para enterarte de nuevas oportunidades:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Nuevas obras en tu zona y especialidad</li>
                <li>Ofertas recibidas en tus obras</li>
                <li>Mensajes de otros usuarios</li>
                <li>Alertas de documentos por vencer</li>
              </ul>
            </div>
          )}

          {/* Default content for other steps */}
          {!['WELCOME', 'USER_TYPE', 'NOTIFICATIONS'].includes(currentStep.id) && (
            <p className="text-gray-600">Haz clic en continuar para completar este paso.</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {!currentStep.required && !currentStep.completed && (
            <Button
              variant="ghost"
              onClick={() => {
                // Skip step logic
                setCurrentStepIndex(Math.min(progress.steps.length - 1, currentStepIndex + 1));
              }}
            >
              Saltar
            </Button>
          )}

          <Button onClick={handleStepAction} disabled={completing || currentStep.completed}>
            {completing ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : currentStep.completed ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completado
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card
          className={progress.canPublishObras ? 'border-green-200 bg-green-50' : 'border-gray-200'}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {progress.canPublishObras ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Publicar Obras</p>
                <p className="text-sm text-gray-600">
                  {progress.canPublishObras
                    ? 'Ya puedes publicar obras'
                    : 'Completa los pasos obligatorios'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={progress.canMakeOfertas ? 'border-green-200 bg-green-50' : 'border-gray-200'}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {progress.canMakeOfertas ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Hacer Ofertas</p>
                <p className="text-sm text-gray-600">
                  {progress.canMakeOfertas
                    ? 'Ya puedes ofertar en obras'
                    : 'Completa los pasos obligatorios'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

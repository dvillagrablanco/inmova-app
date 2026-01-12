'use client';

/**
 * Componente de Onboarding Personalizado
 * 
 * Muestra un flujo de onboarding adaptado al perfil del usuario,
 * plan contratado y nivel de experiencia.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Building2,
  Users,
  FileText,
  CreditCard,
  Upload,
  Calculator,
  Euro,
  BarChart2,
  Briefcase,
  Building,
  UserPlus,
  Plug,
  Receipt,
  Plus,
  Globe,
  Hotel,
  Link,
  TrendingUp,
  Home,
  LayoutDashboard,
  Users2,
  Clock,
  Play,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanAccess } from '@/lib/hooks/usePlanAccess';
import {
  OnboardingFlow,
  OnboardingStep,
  getOnboardingFlow,
  filterStepsByPlan,
  calculateOnboardingProgress,
  ONBOARDING_FLOWS,
} from '@/lib/onboarding-config';
import { ClientProfile } from '@/lib/subscription-plans-config';

// Mapeo de iconos
const ICONS: Record<string, React.ElementType> = {
  CheckCircle2,
  Sparkles,
  Building2,
  Users,
  FileText,
  CreditCard,
  Upload,
  Calculator,
  Euro,
  BarChart2,
  Briefcase,
  Building,
  UserPlus,
  Plug,
  Receipt,
  Plus,
  Globe,
  Hotel,
  Link,
  TrendingUp,
  Home,
  LayoutDashboard,
  Users2,
};

interface PersonalizedOnboardingProps {
  /** Si debe mostrarse al abrir */
  initialOpen?: boolean;
  /** Callback al completar */
  onComplete?: () => void;
  /** Forzar un flujo específico */
  forceFlow?: string;
}

export function PersonalizedOnboarding({
  initialOpen = false,
  onComplete,
  forceFlow,
}: PersonalizedOnboardingProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentPlan, availableModules } = usePlanAccess();
  
  const [open, setOpen] = useState(initialOpen);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  
  // Obtener perfil del usuario
  const userProfile: ClientProfile = useMemo(() => {
    // En producción, esto vendría de la sesión o BD
    const profile = (session?.user as any)?.clientProfile;
    return profile || 'propietario_individual';
  }, [session]);
  
  // Obtener flujo de onboarding
  const onboardingFlow = useMemo(() => {
    if (forceFlow && ONBOARDING_FLOWS[forceFlow]) {
      return ONBOARDING_FLOWS[forceFlow];
    }
    return getOnboardingFlow(userProfile);
  }, [userProfile, forceFlow]);
  
  // Filtrar pasos según plan
  const filteredSteps = useMemo(() => {
    if (!onboardingFlow) return [];
    return filterStepsByPlan(onboardingFlow.steps, currentPlan, availableModules);
  }, [onboardingFlow, currentPlan, availableModules]);
  
  // Paso actual
  const currentStep = filteredSteps[currentStepIndex];
  
  // Progreso
  const progress = useMemo(() => {
    return calculateOnboardingProgress(completedSteps, filteredSteps);
  }, [completedSteps, filteredSteps]);
  
  // Verificar si ya completó onboarding (localStorage)
  useEffect(() => {
    const completed = localStorage.getItem(`onboarding_completed_${session?.user?.email}`);
    if (completed === 'true') {
      setOpen(false);
    }
  }, [session]);
  
  // Handlers
  const handleNext = () => {
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
    
    if (currentStepIndex < filteredSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const handleSkip = () => {
    if (currentStep) {
      setSkippedSteps(prev => [...prev, currentStep.id]);
    }
    handleNext();
  };
  
  const handleAction = () => {
    if (currentStep?.action) {
      switch (currentStep.action.type) {
        case 'navigate':
          router.push(currentStep.action.target);
          // Marcar como completado al navegar
          setCompletedSteps(prev => [...prev, currentStep.id]);
          setOpen(false);
          break;
        case 'tour':
          // Iniciar tour interactivo
          window.dispatchEvent(new CustomEvent('start-tour', { 
            detail: { tourId: currentStep.action.target } 
          }));
          break;
        case 'modal':
          // Abrir modal específico
          break;
        case 'external':
          window.open(currentStep.action.target, '_blank');
          break;
      }
    }
  };
  
  const handleComplete = () => {
    localStorage.setItem(`onboarding_completed_${session?.user?.email}`, 'true');
    setOpen(false);
    onComplete?.();
  };
  
  const handleDismiss = () => {
    setOpen(false);
  };
  
  if (!onboardingFlow || !currentStep) {
    return null;
  }
  
  const StepIcon = ICONS[currentStep.icon] || Sparkles;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === filteredSteps.length - 1;
  
  return (
    <>
      {/* Botón para reabrir onboarding */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all group"
          title="Continuar tutorial"
        >
          <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {onboardingFlow.name}
                </Badge>
                <DialogTitle className="text-xl">
                  {currentStep.title}
                </DialogTitle>
                <DialogDescription>
                  {currentStep.description}
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDismiss}
                className="absolute right-4 top-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {/* Progress */}
          <div className="px-1 py-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Paso {currentStepIndex + 1} de {filteredSteps.length}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{progress.remainingTime} min restantes
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
          
          {/* Step Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mb-4",
                currentStep.type === 'info' && "bg-blue-100 text-blue-600",
                currentStep.type === 'action' && "bg-green-100 text-green-600",
                currentStep.type === 'setup' && "bg-purple-100 text-purple-600",
                currentStep.type === 'tour' && "bg-amber-100 text-amber-600",
                currentStep.type === 'video' && "bg-rose-100 text-rose-600",
              )}>
                <StepIcon className="h-10 w-10" />
              </div>
            </div>
            
            {/* Tips */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <Card className="mb-4 bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-sm">💡 Consejos</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Action Button */}
            {currentStep.action && (
              <div className="flex justify-center mb-4">
                <Button 
                  size="lg" 
                  onClick={handleAction}
                  className="min-w-[200px]"
                >
                  {currentStep.action.label}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Step Indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {filteredSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStepIndex && "w-6 bg-primary",
                    index < currentStepIndex && "bg-green-500",
                    index > currentStepIndex && "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {!isFirstStep && (
                <Button variant="ghost" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep.skippable && !isLastStep && (
                <Button variant="ghost" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4 mr-1" />
                  Saltar
                </Button>
              )}
              
              <Button onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Widget de progreso de onboarding para el dashboard
 */
export function OnboardingProgressWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const isCompleted = localStorage.getItem(`onboarding_completed_${session?.user?.email}`);
    setCompleted(isCompleted === 'true');
    
    // Calcular progreso basado en acciones completadas
    const actions = [
      localStorage.getItem('has_property'),
      localStorage.getItem('has_tenant'),
      localStorage.getItem('has_contract'),
    ];
    const completedActions = actions.filter(Boolean).length;
    setProgress(Math.round((completedActions / actions.length) * 100));
  }, [session]);
  
  if (completed && progress === 100) {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">Completa tu configuración</h3>
            <p className="text-sm text-muted-foreground">
              {progress}% completado
            </p>
          </div>
          <Badge variant="secondary">{progress < 100 ? 'En progreso' : 'Completo'}</Badge>
        </div>
        
        <Progress value={progress} className="h-2 mb-3" />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              localStorage.getItem('has_property') ? "bg-green-100 text-green-600" : "bg-muted"
            )}>
              {localStorage.getItem('has_property') ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span className="text-xs">1</span>
              )}
            </div>
            <span className={localStorage.getItem('has_property') ? 'line-through text-muted-foreground' : ''}>
              Crear primera propiedad
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              localStorage.getItem('has_tenant') ? "bg-green-100 text-green-600" : "bg-muted"
            )}>
              {localStorage.getItem('has_tenant') ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span className="text-xs">2</span>
              )}
            </div>
            <span className={localStorage.getItem('has_tenant') ? 'line-through text-muted-foreground' : ''}>
              Añadir inquilino
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              localStorage.getItem('has_contract') ? "bg-green-100 text-green-600" : "bg-muted"
            )}>
              {localStorage.getItem('has_contract') ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span className="text-xs">3</span>
              )}
            </div>
            <span className={localStorage.getItem('has_contract') ? 'line-through text-muted-foreground' : ''}>
              Crear contrato
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={() => router.push('/onboarding')}
        >
          Continuar configuración
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  UserPlus,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  PenTool,
  Landmark,
  Globe,
  Home,
  Shield,
  X,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_PROFILE = 'onboarding_profile';
const STORAGE_COMPLETED = 'onboarding_steps_completed';
const STORAGE_DISMISSED = 'onboarding_guide_dismissed';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ElementType;
}

const GESTOR_STEPS: SetupStep[] = [
  { id: 'gestor_1', title: 'Añade tu primer inmueble', description: 'Registra tu primera propiedad', route: '/propiedades/nuevo', icon: Building2 },
  { id: 'gestor_2', title: 'Registra un propietario', description: 'Añade datos del propietario', route: '/contratos-gestion/nuevo', icon: UserPlus },
  { id: 'gestor_3', title: 'Añade un inquilino', description: 'Registra tu primer inquilino', route: '/inquilinos/nuevo', icon: Users },
  { id: 'gestor_4', title: 'Crea un contrato', description: 'Genera tu primer contrato', route: '/contratos/nuevo', icon: FileText },
  { id: 'gestor_5', title: 'Programa un cobro', description: 'Configura pagos recurrentes', route: '/pagos/nuevo', icon: CreditCard },
  { id: 'gestor_6', title: 'Configura liquidaciones', description: 'Define liquidaciones de gastos', route: '/liquidaciones/nueva', icon: Receipt },
  { id: 'gestor_7', title: 'Añade un proveedor', description: 'Registra proveedores de mantenimiento', route: '/portal-proveedor/register', icon: Wrench },
  { id: 'gestor_8', title: 'Configura firma digital', description: 'Activa firma electrónica', route: '/admin/firma-digital', icon: PenTool },
  { id: 'gestor_9', title: 'Conecta tu cuenta bancaria', description: 'Vincula tu banco para cobros', route: '/pagos/configuracion', icon: Landmark },
  { id: 'gestor_10', title: 'Activa portales', description: 'Habilita portales de inquilino y proveedor', route: '/admin/portales-externos', icon: Globe },
];

const PROPIETARIO_STEPS: SetupStep[] = [
  { id: 'prop_1', title: 'Añade tu primer inmueble', description: 'Registra tu primera propiedad', route: '/propiedades/nuevo', icon: Building2 },
  { id: 'prop_2', title: 'Registra un inquilino', description: 'Añade datos del inquilino', route: '/inquilinos/nuevo', icon: Users },
  { id: 'prop_3', title: 'Crea un contrato', description: 'Genera tu primer contrato', route: '/contratos/nuevo', icon: FileText },
  { id: 'prop_4', title: 'Configura cobros automáticos', description: 'Activa cobros recurrentes', route: '/pagos/nuevo', icon: CreditCard },
  { id: 'prop_5', title: 'Añade un seguro', description: 'Registra la póliza de la propiedad', route: '/admin/seguros', icon: Shield },
];

export function GuidedSetupCards() {
  const router = useRouter();
  const [profile, setProfile] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDismissed = localStorage.getItem(STORAGE_DISMISSED);
    if (storedDismissed === 'true') {
      setDismissed(true);
      return;
    }

    const storedProfile = localStorage.getItem(STORAGE_PROFILE);
    const storedCompleted = localStorage.getItem(STORAGE_COMPLETED);

    if (storedProfile) {
      setProfile(storedProfile);
    }
    if (storedCompleted) {
      try {
        const parsed = JSON.parse(storedCompleted);
        setCompletedIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCompletedIds([]);
      }
    }
  }, []);

  const steps = profile === 'propietario' ? PROPIETARIO_STEPS : profile === 'gestor' ? GESTOR_STEPS : [];
  const completedCount = steps.filter((s) => completedIds.includes(s.id)).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const handleStepClick = (step: SetupStep) => {
    router.push(step.route);
  };

  const handleToggleComplete = (stepId: string) => {
    const newCompleted = completedIds.includes(stepId)
      ? completedIds.filter((id) => id !== stepId)
      : [...completedIds, stepId];
    setCompletedIds(newCompleted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_COMPLETED, JSON.stringify(newCompleted));
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DISMISSED, 'true');
    }
  };

  if (dismissed || steps.length === 0) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Guía de configuración</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {completedCount} de {totalSteps} pasos completados ({progressPercent}%)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            aria-label="Cerrar guía"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progressPercent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step) => {
            const isCompleted = completedIds.includes(step.id);
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer',
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(step.id);
                  }}
                  className="flex-shrink-0 mt-0.5"
                  aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
                  )}
                </button>
                <div
                  className="flex-1 min-w-0"
                  onClick={() => handleStepClick(step)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStepClick(step)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5 flex-shrink-0', isCompleted ? 'text-green-600' : 'text-indigo-600')} />
                    <h4
                      className={cn(
                        'text-sm font-medium',
                        isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                      )}
                    >
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
                {!isCompleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(step);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                  >
                    Ir
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="w-full mt-4"
        >
          Cerrar guía
        </Button>
      </CardContent>
    </Card>
  );
}

export default GuidedSetupCards;

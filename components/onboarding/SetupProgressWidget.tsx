'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ChevronRight, X, Sparkles, Database, Loader2 } from 'lucide-react';
import { getUserVerticalTour, calculateSetupProgress, getNextRecommendedAction, SetupAction, type BusinessVertical } from '@/lib/onboarding-tours';
import logger from '@/lib/logger';
import { cn } from '@/lib/utils';

interface SetupProgressWidgetProps {
  className?: string;
}

export function SetupProgressWidget({ className }: SetupProgressWidgetProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [setupActions, setSetupActions] = useState<SetupAction[]>([]);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [hasDemoData, setHasDemoData] = useState(false);

  useEffect(() => {
    // Verificar si el widget fue cerrado
    const dismissed = localStorage.getItem('setup_progress_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // TODO: Obtener businessVertical de la compañía del usuario
    // Por ahora, usamos un valor por defecto si no está disponible
    const userBusinessVertical = (session?.user as any)?.businessVertical;
    if (!userBusinessVertical) {
      return;
    }

    const tour = getUserVerticalTour(userBusinessVertical as BusinessVertical);
    if (!tour) {
      return;
    }

    // Cargar estado de las acciones desde localStorage o API
    loadSetupActionsState(tour.setupActions);
  }, [session?.user]);

  const loadSetupActionsState = async (actions: SetupAction[]) => {
    try {
      // Intentar obtener el estado desde la API
      const response = await fetch('/api/user/setup-progress');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que completedActions sea un array antes de usar .includes()
        const completedActions = Array.isArray(data.completedActions) ? data.completedActions : [];
        const updatedActions = actions.map(action => ({
          ...action,
          completed: completedActions.includes(action.id),
        }));
        setSetupActions(updatedActions);
        setProgress(calculateSetupProgress(updatedActions));
      } else {
        // Fallback a localStorage
        const localState = localStorage.getItem('setup_actions_state');
        if (localState) {
          const savedState: Record<string, boolean> = JSON.parse(localState);
          const updatedActions = actions.map(action => ({
            ...action,
            completed: savedState[action.id] || false,
          }));
          setSetupActions(updatedActions);
          setProgress(calculateSetupProgress(updatedActions));
        } else {
          setSetupActions(actions);
          setProgress(0);
        }
      }
    } catch (error) {
      logger.error('Error loading setup actions state', error);
      setSetupActions(actions);
      setProgress(0);
    }
  };

  const handleActionClick = async (action: SetupAction) => {
    router.push(action.route);
  };

  const handleToggleComplete = async (actionId: string) => {
    const updatedActions = setupActions.map(action =>
      action.id === actionId ? { ...action, completed: !action.completed } : action
    );
    setSetupActions(updatedActions);
    const newProgress = calculateSetupProgress(updatedActions);
    setProgress(newProgress);

    // Guardar en localStorage
    const stateToSave = updatedActions.reduce((acc, action) => {
      acc[action.id] = action.completed;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('setup_actions_state', JSON.stringify(stateToSave));

    // Intentar guardar en la API
    try {
      await fetch('/api/user/setup-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedActions: updatedActions.filter(a => a.completed).map(a => a.id),
        }),
      });
    } catch (error) {
      logger.error('Error saving setup progress to API', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('setup_progress_dismissed', 'true');
  };

  const handleRestoreDismissed = () => {
    setIsDismissed(false);
    localStorage.removeItem('setup_progress_dismissed');
  };

  // Si está al 100%, mostrar celebración
  if (progress === 100 && !isDismissed) {
    return (
      <Card className={cn('border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-2xl">
              🎉
            </div>
            <div>
              <CardTitle className="text-xl text-green-800">¡Configuración completa!</CardTitle>
              <p className="text-sm text-green-700 mt-0.5">
                Has completado todas las acciones. ¡Listo para sacar el máximo partido a INMOVA!
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white text-sm px-3 py-1">100%</Badge>
            <span className="text-sm text-green-700">Todos los pasos completados</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si fue cerrado, no mostrar nada (o mostrar un botón pequeño para restaurar)
  if (isDismissed) {
    return null;
  }

  const nextAction = getNextRecommendedAction(setupActions);

  return (
    <Card className={cn('gradient-bg border-indigo-200 shadow-lg', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Badge de porcentaje prominente */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 ring-4 ring-indigo-200/50">
              {progress}%
            </div>
            <div>
              <CardTitle className="text-lg">Progreso de Configuración</CardTitle>
              <CardDescription className="mt-1">
                Tu configuración está al {progress}%
              </CardDescription>
              <p className="text-sm text-gray-600 mt-1">
                {setupActions.filter(a => a.completed).length} de {setupActions.length} pasos completados
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 hover:bg-white/50 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          {progress < 100 && (
            <span className="text-xs text-indigo-600 font-medium">Casi listo...</span>
          )}
        </div>

        {/* Próxima acción recomendada */}
        {nextAction && !isExpanded && (
          <div className="p-4 bg-white rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Circle className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">{nextAction.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{nextAction.description}</p>
                <Button
                  size="sm"
                  onClick={() => handleActionClick(nextAction)}
                  className="mt-3 gradient-primary"
                >
                  Comenzar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Botón para expandir/colapsar */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? 'Ocultar pasos' : `Ver todos los pasos (${setupActions.length})`}
        </Button>

        {/* Lista completa de acciones (expandible) */}
        {isExpanded && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Completados: {setupActions.filter(a => a.completed).length} · Pendientes: {setupActions.filter(a => !a.completed).length}
            </p>
            {setupActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  action.completed
                    ? 'bg-green-50/80 border-green-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                )}
              >
                <button
                  onClick={() => handleToggleComplete(action.id)}
                  className="flex-shrink-0"
                  aria-label={action.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                  {action.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h5 className={cn(
                    'text-sm font-medium',
                    action.completed ? 'text-green-800 line-through' : 'text-gray-900'
                  )}>
                    {action.title}
                  </h5>
                  <p className={cn(
                    'text-xs mt-0.5',
                    action.completed ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {action.description}
                  </p>
                </div>
                {!action.completed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleActionClick(action)}
                    className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                  >
                    Ir
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SetupProgressWidget;

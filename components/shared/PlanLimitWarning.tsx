/**
 * Componente de advertencia de límite de plan
 * Muestra un mensaje cuando el usuario está cerca o ha alcanzado su límite
 */

'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Crown, ArrowUpRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PlanLimitWarningProps {
  resourceName: string;
  used: number;
  limit: number | null;
  showUpgrade?: boolean;
  className?: string;
}

export function PlanLimitWarning({
  resourceName,
  used,
  limit,
  showUpgrade = true,
  className,
}: PlanLimitWarningProps) {
  const router = useRouter();

  // Si no hay límite, no mostrar nada
  if (limit === null || limit === -1) {
    return null;
  }

  const percentage = Math.min(Math.round((used / limit) * 100), 100);
  const isAtLimit = used >= limit;
  const isNearLimit = percentage >= 80;

  // No mostrar si está por debajo del 80%
  if (percentage < 80) {
    return null;
  }

  return (
    <Alert
      variant={isAtLimit ? 'destructive' : 'default'}
      className={cn(
        isNearLimit && !isAtLimit && 'border-yellow-500 bg-yellow-50',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {isAtLimit ? (
          'Límite alcanzado'
        ) : (
          'Cerca del límite'
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>{resourceName}</span>
            <span className="font-medium">
              {used} / {limit}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className={cn(
              'h-2',
              isAtLimit && 'bg-red-200 [&>div]:bg-red-500',
              isNearLimit && !isAtLimit && 'bg-yellow-200 [&>div]:bg-yellow-500'
            )}
          />

          {isAtLimit ? (
            <p className="text-sm">
              Has alcanzado el límite de {resourceName.toLowerCase()} de tu plan actual.
              {showUpgrade && ' Actualiza tu plan para continuar añadiendo más.'}
            </p>
          ) : (
            <p className="text-sm">
              Estás usando el {percentage}% de tu límite de {resourceName.toLowerCase()}.
            </p>
          )}

          {showUpgrade && (
            <Button
              variant={isAtLimit ? 'default' : 'outline'}
              size="sm"
              onClick={() => router.push('/planes')}
              className="mt-2"
            >
              <Crown className="w-4 h-4 mr-2" />
              Actualizar Plan
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Componente modal para bloquear acciones cuando se alcanza el límite
 */
interface PlanLimitBlockerProps {
  show: boolean;
  resourceName: string;
  onClose: () => void;
}

export function PlanLimitBlocker({
  show,
  resourceName,
  onClose,
}: PlanLimitBlockerProps) {
  const router = useRouter();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Límite Alcanzado</h2>
          
          <p className="text-gray-600 mb-6">
            Has alcanzado el límite de {resourceName.toLowerCase()} incluidos en tu plan actual.
            Para continuar, actualiza a un plan superior.
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => router.push('/planes')}>
              <Crown className="w-4 h-4 mr-2" />
              Ver Planes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanLimitWarning;

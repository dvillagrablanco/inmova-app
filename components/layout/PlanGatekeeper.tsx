'use client';

/**
 * PlanGatekeeper - Componente para bloquear acceso según plan
 * 
 * Muestra contenido alternativo cuando el usuario intenta
 * acceder a una funcionalidad no incluida en su plan.
 */

import { useRouter } from 'next/navigation';
import { Lock, Sparkles, ArrowRight, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanAccess } from '@/lib/hooks/usePlanAccess';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId, comparePlans } from '@/lib/subscription-plans-config';
import { cn } from '@/lib/utils';

interface PlanGatekeeperProps {
  /** Módulo requerido */
  requiredModule?: string;
  /** Plan mínimo requerido */
  requiredPlan?: SubscriptionPlanId;
  /** Contenido a mostrar si tiene acceso */
  children: React.ReactNode;
  /** Mensaje personalizado */
  customMessage?: string;
  /** Estilo compacto (para widgets) */
  compact?: boolean;
}

export function PlanGatekeeper({
  requiredModule,
  requiredPlan,
  children,
  customMessage,
  compact = false,
}: PlanGatekeeperProps) {
  const router = useRouter();
  const { canAccessModule, currentPlan, getUpgradeSuggestion } = usePlanAccess();
  
  // Verificar acceso
  const hasAccess = requiredModule 
    ? canAccessModule(requiredModule)
    : requiredPlan 
      ? isPlanSufficient(currentPlan, requiredPlan)
      : true;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Obtener sugerencia de upgrade
  const suggestion = requiredModule ? getUpgradeSuggestion(requiredModule) : null;
  const suggestedPlan = suggestion?.suggestedPlan || requiredPlan || 'professional';
  const suggestedPlanData = SUBSCRIPTION_PLANS[suggestedPlan];
  const currentPlanData = SUBSCRIPTION_PLANS[currentPlan];
  
  // Comparación de planes
  const comparison = comparePlans(currentPlan, suggestedPlan);
  
  if (compact) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">Funcionalidad Premium</p>
          <Button 
            size="sm" 
            onClick={() => router.push('/pricing')}
            className="gap-1"
          >
            <Crown className="h-3 w-3" />
            Ver planes
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl">
            {customMessage || 'Funcionalidad no disponible'}
          </CardTitle>
          <CardDescription>
            Esta funcionalidad no está incluida en tu plan actual ({currentPlanData.name}).
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Plan recomendado */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "text-white",
                  suggestedPlan === 'professional' && "bg-purple-600",
                  suggestedPlan === 'business' && "bg-amber-600",
                  suggestedPlan === 'enterprise' && "bg-rose-600",
                )}>
                  {suggestedPlanData.name}
                </Badge>
                {suggestedPlanData.highlighted && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Más popular
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{suggestedPlanData.priceMonthly}€</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {suggestedPlanData.description}
            </p>
            
            {/* Features adicionales */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Incluye todo lo de {currentPlanData.name} más:
              </p>
              <ul className="space-y-1">
                {comparison.addedFeatures.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                {comparison.addedModules.length > 0 && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    +{comparison.addedModules.length} módulos adicionales
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push('/pricing')}
              className="w-full"
            >
              Ver todos los planes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="w-full"
            >
              Volver atrás
            </Button>
          </div>
          
          {/* Info adicional */}
          <p className="text-xs text-center text-muted-foreground">
            ¿Tienes dudas? <a href="/contacto" className="underline">Contacta con ventas</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Verifica si el plan actual es suficiente
 */
function isPlanSufficient(
  currentPlan: SubscriptionPlanId, 
  requiredPlan: SubscriptionPlanId
): boolean {
  const planOrder: SubscriptionPlanId[] = [
    'free', 'starter', 'basic', 'professional', 'business', 'enterprise'
  ];
  
  return planOrder.indexOf(currentPlan) >= planOrder.indexOf(requiredPlan);
}

/**
 * HOC para envolver páginas con restricción de plan
 */
export function withPlanGate<P extends object>(
  Component: React.ComponentType<P>,
  requiredModule?: string,
  requiredPlan?: SubscriptionPlanId
) {
  return function GatedComponent(props: P) {
    return (
      <PlanGatekeeper 
        requiredModule={requiredModule}
        requiredPlan={requiredPlan}
      >
        <Component {...props} />
      </PlanGatekeeper>
    );
  };
}

/**
 * Badge para mostrar en items del sidebar bloqueados
 */
export function PlanRequiredBadge({ 
  plan 
}: { 
  plan: SubscriptionPlanId 
}) {
  return (
    <Badge 
      variant="outline" 
      className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200"
    >
      {plan.toUpperCase()}
    </Badge>
  );
}

/**
 * Tooltip para items bloqueados
 */
export function LockedFeatureTooltip({
  children,
  moduleName,
  requiredPlan,
}: {
  children: React.ReactNode;
  moduleName: string;
  requiredPlan: SubscriptionPlanId;
}) {
  return (
    <div className="relative group cursor-not-allowed">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-lg min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-sm">{moduleName}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Disponible en plan {SUBSCRIPTION_PLANS[requiredPlan].name}
          </p>
          <Button size="sm" className="w-full h-7 text-xs">
            Mejorar plan
          </Button>
        </div>
      </div>
    </div>
  );
}

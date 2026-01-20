/**
 * Hook para verificar límites del plan del usuario
 * 
 * Uso:
 * const { canCreateProperty, limits, isLoading } = usePlanLimits();
 * 
 * if (!canCreateProperty) {
 *   toast.error('Has alcanzado el límite de propiedades de tu plan');
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PlanLimits {
  propiedades: { used: number; limit: number | null };
  usuarios: { used: number; limit: number | null };
  inquilinos: { used: number; limit: number | null };
  firmas: { used: number; limit: number | null };
  storage: { used: number; limit: number | null }; // en GB
  tokens: { used: number; limit: number | null };
}

interface UsePlanLimitsReturn {
  limits: PlanLimits | null;
  plan: {
    id: string;
    nombre: string;
    tier: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  
  // Helpers
  canCreateProperty: boolean;
  canCreateUser: boolean;
  canCreateTenant: boolean;
  canUseSignature: boolean;
  canUseAI: boolean;
  
  // Percentages
  propertyUsagePercent: number;
  userUsagePercent: number;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function usePlanLimits(): UsePlanLimitsReturn {
  const { data: session } = useSession();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [plan, setPlan] = useState<{ id: string; nombre: string; tier: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error('Error obteniendo información del plan');
      }

      const data = await response.json();

      if (data.subscription?.plan) {
        setPlan({
          id: data.subscription.plan.id,
          nombre: data.subscription.plan.nombre,
          tier: data.subscription.plan.tier,
        });
      }

      setLimits({
        propiedades: {
          used: data.usage?.propiedades?.used || 0,
          limit: data.usage?.propiedades?.limit || null,
        },
        usuarios: {
          used: data.usage?.usuarios?.used || 0,
          limit: data.usage?.usuarios?.limit || null,
        },
        inquilinos: {
          used: data.usage?.inquilinos?.used || 0,
          limit: data.usage?.inquilinos?.limit || null,
        },
        firmas: {
          used: 0, // TODO: Obtener de la BD
          limit: data.subscription?.plan?.signaturesIncludedMonth || null,
        },
        storage: {
          used: 0, // TODO: Calcular uso de S3
          limit: data.subscription?.plan?.storageIncludedGB || null,
        },
        tokens: {
          used: 0, // TODO: Obtener de la BD
          limit: data.subscription?.plan?.aiTokensIncludedMonth || null,
        },
      });
    } catch (err: any) {
      setError(err.message);
      console.error('[usePlanLimits] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Helper functions
  const checkCanCreate = (resource: keyof PlanLimits): boolean => {
    if (!limits) return true; // Si no hay datos, permitir (fallback)
    
    const { used, limit } = limits[resource];
    
    // Si no hay límite (null o -1), es ilimitado
    if (limit === null || limit === -1) return true;
    
    return used < limit;
  };

  const calculatePercent = (resource: keyof PlanLimits): number => {
    if (!limits) return 0;
    
    const { used, limit } = limits[resource];
    
    if (limit === null || limit === -1 || limit === 0) return 0;
    
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return {
    limits,
    plan,
    isLoading,
    error,
    
    // Helpers
    canCreateProperty: checkCanCreate('propiedades'),
    canCreateUser: checkCanCreate('usuarios'),
    canCreateTenant: checkCanCreate('inquilinos'),
    canUseSignature: checkCanCreate('firmas'),
    canUseAI: checkCanCreate('tokens'),
    
    // Percentages
    propertyUsagePercent: calculatePercent('propiedades'),
    userUsagePercent: calculatePercent('usuarios'),
    
    // Refresh
    refresh: fetchLimits,
  };
}

/**
 * Hook simplificado para verificar si una acción está permitida
 */
export function useCanPerformAction(action: 'create_property' | 'create_user' | 'create_tenant' | 'use_signature' | 'use_ai'): {
  allowed: boolean;
  reason?: string;
  isLoading: boolean;
} {
  const { 
    canCreateProperty, 
    canCreateUser, 
    canCreateTenant, 
    canUseSignature, 
    canUseAI,
    isLoading,
    limits,
    plan 
  } = usePlanLimits();

  const actionMap: Record<string, { allowed: boolean; limitKey: keyof PlanLimits }> = {
    create_property: { allowed: canCreateProperty, limitKey: 'propiedades' },
    create_user: { allowed: canCreateUser, limitKey: 'usuarios' },
    create_tenant: { allowed: canCreateTenant, limitKey: 'inquilinos' },
    use_signature: { allowed: canUseSignature, limitKey: 'firmas' },
    use_ai: { allowed: canUseAI, limitKey: 'tokens' },
  };

  const check = actionMap[action];
  
  let reason: string | undefined;
  
  if (!check.allowed && limits) {
    const { used, limit } = limits[check.limitKey];
    reason = `Has alcanzado el límite de tu plan (${used}/${limit}). Actualiza tu plan para continuar.`;
  }

  return {
    allowed: check.allowed,
    reason,
    isLoading,
  };
}

export default usePlanLimits;

/**
 * Hook para gestionar acceso basado en plan de suscripción
 * 
 * Proporciona:
 * - Verificación de acceso a módulos
 * - Verificación de acceso a rutas
 * - Límites del plan actual
 * - Sugerencias de upgrade
 */

'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  MODULES_BY_PLAN,
  planIncludesModule,
  planAllowsRoute,
  getModulesForPlan,
  comparePlans,
} from '@/lib/subscription-plans-config';

interface PlanAccessHook {
  /** Plan actual del usuario */
  currentPlan: SubscriptionPlanId;
  /** Nombre del plan */
  planName: string;
  /** Módulos disponibles */
  availableModules: string[];
  /** Verifica si puede acceder a un módulo */
  canAccessModule: (moduleId: string) => boolean;
  /** Verifica si puede acceder a una ruta */
  canAccessRoute: (route: string) => boolean;
  /** Límites del plan */
  limits: {
    maxProperties: number;
    maxBuildings: number;
    maxUsers: number;
    maxTenants: number;
    maxDocuments: number;
    apiCallsPerMonth: number;
    isUnlimited: (key: string) => boolean;
  };
  /** Features del plan */
  features: {
    hasPortalInquilino: boolean;
    hasPortalPropietario: boolean;
    hasFirmaDigital: boolean;
    hasReportesAvanzados: boolean;
    hasApiAccess: boolean;
    hasMultiEmpresa: boolean;
    hasWhiteLabel: boolean;
    hasSoportePrioritario: boolean;
  };
  /** Verifica si ha alcanzado un límite */
  hasReachedLimit: (key: string, currentCount: number) => boolean;
  /** Obtiene upgrade sugerido */
  getUpgradeSuggestion: (moduleId: string) => {
    suggestedPlan: SubscriptionPlanId;
    addedFeatures: string[];
    priceDifference: number;
  } | null;
  /** Si el plan está cargando */
  isLoading: boolean;
}

/**
 * Hook para verificar acceso basado en el plan de suscripción
 */
export function usePlanAccess(): PlanAccessHook {
  const { data: session, status } = useSession();
  
  // Obtener plan de la sesión (fallback a 'free')
  const currentPlan: SubscriptionPlanId = useMemo(() => {
    if (!session?.user) return 'free';
    
    // El plan puede venir del usuario o de la empresa
    const userPlan = (session.user as any).subscriptionPlan;
    const companyPlan = (session.user as any).company?.subscriptionPlan;
    
    return userPlan || companyPlan || 'free';
  }, [session]);
  
  // Datos del plan
  const planData = useMemo(() => {
    return SUBSCRIPTION_PLANS[currentPlan] || SUBSCRIPTION_PLANS.free;
  }, [currentPlan]);
  
  // Módulos disponibles
  const availableModules = useMemo(() => {
    return getModulesForPlan(currentPlan);
  }, [currentPlan]);
  
  // Funciones de verificación
  const canAccessModule = useMemo(() => {
    return (moduleId: string) => planIncludesModule(currentPlan, moduleId);
  }, [currentPlan]);
  
  const canAccessRoute = useMemo(() => {
    return (route: string) => {
      // Rutas siempre permitidas
      const alwaysAllowed = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/pricing',
        '/api',
        '/_next',
      ];
      
      if (alwaysAllowed.some(r => route.startsWith(r))) {
        return true;
      }
      
      return planAllowsRoute(currentPlan, route);
    };
  }, [currentPlan]);
  
  // Límites
  const limits = useMemo(() => ({
    maxProperties: planData.limits.maxProperties,
    maxBuildings: planData.limits.maxBuildings,
    maxUsers: planData.limits.maxUsers,
    maxTenants: planData.limits.maxTenants,
    maxDocuments: planData.limits.maxDocuments,
    apiCallsPerMonth: planData.limits.apiCallsPerMonth,
    isUnlimited: (key: string) => {
      const value = (planData.limits as any)[key];
      return value === -1;
    },
  }), [planData]);
  
  // Features
  const features = useMemo(() => ({
    hasPortalInquilino: planData.features.portalInquilino,
    hasPortalPropietario: planData.features.portalPropietario,
    hasFirmaDigital: planData.features.firmaDigital,
    hasReportesAvanzados: planData.features.reportesAvanzados,
    hasApiAccess: planData.features.apiAccess,
    hasMultiEmpresa: planData.features.multiEmpresa,
    hasWhiteLabel: planData.features.whiteLabel,
    hasSoportePrioritario: planData.features.soportePrioritario,
  }), [planData]);
  
  // Verificar límite
  const hasReachedLimit = useMemo(() => {
    return (key: string, currentCount: number) => {
      const limit = (planData.limits as any)[key];
      if (limit === -1) return false; // Ilimitado
      return currentCount >= limit;
    };
  }, [planData]);
  
  // Sugerencia de upgrade
  const getUpgradeSuggestion = useMemo(() => {
    return (moduleId: string) => {
      // Encontrar el plan más barato que incluya el módulo
      const plans: SubscriptionPlanId[] = ['starter', 'basic', 'professional', 'business', 'enterprise'];
      const currentIndex = plans.indexOf(currentPlan);
      
      for (let i = currentIndex + 1; i < plans.length; i++) {
        const upgradePlan = plans[i];
        if (planIncludesModule(upgradePlan, moduleId)) {
          const upgradePlanData = SUBSCRIPTION_PLANS[upgradePlan];
          const comparison = comparePlans(currentPlan, upgradePlan);
          
          return {
            suggestedPlan: upgradePlan,
            addedFeatures: comparison.addedFeatures,
            priceDifference: upgradePlanData.priceMonthly - planData.priceMonthly,
          };
        }
      }
      
      return null;
    };
  }, [currentPlan, planData]);
  
  return {
    currentPlan,
    planName: planData.name,
    availableModules,
    canAccessModule,
    canAccessRoute,
    limits,
    features,
    hasReachedLimit,
    getUpgradeSuggestion,
    isLoading: status === 'loading',
  };
}

// HOC withPlanAccess está disponible en components/layout/PlanGatekeeper.tsx

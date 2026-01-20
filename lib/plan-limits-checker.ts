/**
 * Verificador de Límites del Plan
 * 
 * Utilidad para verificar límites del plan de suscripción en las APIs.
 * Debe usarse antes de crear nuevos recursos (propiedades, usuarios, inquilinos).
 * 
 * @module PlanLimitsChecker
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type ResourceType = 'properties' | 'users' | 'tenants' | 'signatures' | 'storage' | 'ai_tokens';

export interface LimitCheckResult {
  allowed: boolean;
  limit: number | null; // null = ilimitado
  used: number;
  remaining: number | null; // null = ilimitado
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// LÍMITES POR DEFECTO SEGÚN TIER
// ═══════════════════════════════════════════════════════════════

const DEFAULT_LIMITS: Record<string, Record<ResourceType, number>> = {
  FREE: {
    properties: 1,
    users: 1,
    tenants: 2,
    signatures: 0,
    storage: 1, // GB
    ai_tokens: 0,
  },
  STARTER: {
    properties: 5,
    users: 2,
    tenants: 10,
    signatures: 5,
    storage: 5,
    ai_tokens: 1000,
  },
  BASIC: {
    properties: 15,
    users: 3,
    tenants: 30,
    signatures: 15,
    storage: 10,
    ai_tokens: 5000,
  },
  PROFESSIONAL: {
    properties: 50,
    users: 10,
    tenants: 100,
    signatures: 50,
    storage: 25,
    ai_tokens: 25000,
  },
  BUSINESS: {
    properties: 200,
    users: 25,
    tenants: 500,
    signatures: 200,
    storage: 100,
    ai_tokens: 100000,
  },
  ENTERPRISE: {
    properties: -1, // Ilimitado
    users: -1,
    tenants: -1,
    signatures: -1,
    storage: -1,
    ai_tokens: -1,
  },
};

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica si se puede crear un nuevo recurso según los límites del plan
 */
export async function checkCanCreate(
  resourceType: ResourceType,
  companyId?: string
): Promise<LimitCheckResult> {
  try {
    // Si no se proporciona companyId, obtenerlo de la sesión
    if (!companyId) {
      const session = await getServerSession(authOptions);
      companyId = session?.user?.companyId;
    }

    if (!companyId) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        message: 'No hay empresa asociada al usuario',
      };
    }

    // Lazy load Prisma
    const { getPrismaClient } = await import('./db');
    const prisma = getPrismaClient();

    // Obtener empresa con plan y uso actual
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!company) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        message: 'Empresa no encontrada',
      };
    }

    // Obtener el tier del plan
    const tier = company.subscriptionPlan?.tier?.toUpperCase() || 'FREE';
    const planLimits = DEFAULT_LIMITS[tier] || DEFAULT_LIMITS.FREE;
    
    // Obtener límite específico del plan si está definido en la BD
    let limit: number;
    switch (resourceType) {
      case 'properties':
        limit = company.maxPropiedades || company.subscriptionPlan?.maxPropiedades || planLimits.properties;
        break;
      case 'users':
        limit = company.maxUsuarios || company.subscriptionPlan?.maxUsuarios || planLimits.users;
        break;
      case 'signatures':
        limit = company.subscriptionPlan?.signaturesIncludedMonth || planLimits.signatures;
        break;
      case 'storage':
        limit = company.subscriptionPlan?.storageIncludedGB || planLimits.storage;
        break;
      case 'ai_tokens':
        limit = company.subscriptionPlan?.aiTokensIncludedMonth || planLimits.ai_tokens;
        break;
      default:
        limit = planLimits[resourceType] || 0;
    }

    // Contar recursos actuales
    let used = 0;
    switch (resourceType) {
      case 'properties':
        // Contar edificios (buildings) como propiedades
        used = await prisma.building.count({ where: { companyId } });
        break;
      case 'users':
        used = await prisma.user.count({ where: { companyId } });
        break;
      case 'tenants':
        used = await prisma.tenant.count({ where: { companyId } });
        break;
      // Para signatures, storage y ai_tokens necesitaríamos tracking adicional
      default:
        used = 0;
    }

    // -1 significa ilimitado
    if (limit === -1) {
      return {
        allowed: true,
        limit: null,
        used,
        remaining: null,
        message: undefined,
      };
    }

    const remaining = limit - used;
    const allowed = used < limit;

    return {
      allowed,
      limit,
      used,
      remaining: Math.max(0, remaining),
      message: allowed 
        ? undefined 
        : `Has alcanzado el límite de ${getResourceName(resourceType)} de tu plan (${used}/${limit}). Actualiza tu plan para continuar.`,
    };
  } catch (error: any) {
    console.error('[PlanLimitsChecker] Error:', error);
    // En caso de error, permitir la operación para no bloquear
    return {
      allowed: true,
      limit: null,
      used: 0,
      remaining: null,
      message: 'Error verificando límites (operación permitida por defecto)',
    };
  }
}

/**
 * Obtiene los límites y uso actual de todos los recursos
 */
export async function getAllLimits(companyId?: string): Promise<Record<ResourceType, LimitCheckResult>> {
  const resources: ResourceType[] = ['properties', 'users', 'tenants', 'signatures', 'storage', 'ai_tokens'];
  
  const results: Record<ResourceType, LimitCheckResult> = {} as any;
  
  for (const resource of resources) {
    results[resource] = await checkCanCreate(resource, companyId);
  }
  
  return results;
}

/**
 * Middleware helper para verificar límites en APIs
 * Lanza excepción si el límite ha sido alcanzado
 */
export async function requireCanCreate(
  resourceType: ResourceType,
  companyId?: string
): Promise<void> {
  const result = await checkCanCreate(resourceType, companyId);
  
  if (!result.allowed) {
    const error = new Error(result.message || 'Límite del plan alcanzado');
    (error as any).code = 'PLAN_LIMIT_EXCEEDED';
    (error as any).statusCode = 403;
    (error as any).limit = result.limit;
    (error as any).used = result.used;
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getResourceName(resourceType: ResourceType): string {
  const names: Record<ResourceType, string> = {
    properties: 'propiedades',
    users: 'usuarios',
    tenants: 'inquilinos',
    signatures: 'firmas digitales',
    storage: 'almacenamiento',
    ai_tokens: 'tokens de IA',
  };
  return names[resourceType] || resourceType;
}

export default {
  checkCanCreate,
  getAllLimits,
  requireCanCreate,
};

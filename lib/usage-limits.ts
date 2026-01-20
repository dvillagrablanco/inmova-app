/**
 * Usage Limits Middleware
 * 
 * Middleware para verificar límites de uso ANTES de ejecutar acciones costosas
 * 
 * Usage:
 * import { checkUsageLimit } from '@/lib/usage-limits';
 * 
 * // En tu API route
 * const limitCheck = await checkUsageLimit(companyId, 'signaturit');
 * if (!limitCheck.allowed) {
 *   return NextResponse.json(limitCheck.error, { status: 429 });
 * }
 */

import { NextResponse } from 'next/server';
import { getMonthlyUsage, hasExceededLimits, getUsagePercentage } from './usage-tracking-service';

import logger from '@/lib/logger';
export interface LimitCheckResult {
  allowed: boolean;
  usage?: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
  error?: {
    error: string;
    message: string;
    code: string;
    details?: any;
    upgradeUrl?: string;
  };
  warning?: {
    message: string;
    percentage: number;
  };
}

/**
 * Verifica si la empresa puede usar un servicio
 * 
 * @param companyId - ID de la empresa
 * @param service - Servicio a verificar
 * @param requireExact - Si true, bloquea al alcanzar el límite. Si false, permite 1 más
 * 
 * @returns LimitCheckResult con allowed: true/false y detalles
 * 
 * @example
 * const check = await checkUsageLimit(companyId, 'signaturit');
 * if (!check.allowed) {
 *   return NextResponse.json(check.error, { status: 429 });
 * }
 * // Proceder con la acción...
 * await trackUsage({ companyId, service: 'signaturit', ... });
 */
export async function checkUsageLimit(
  companyId: string,
  service: 'signaturit' | 's3' | 'claude' | 'twilio',
  requireExact: boolean = true
): Promise<LimitCheckResult> {
  const usage = await getMonthlyUsage(companyId);
  
  let used = 0;
  let limit = 0;
  let serviceName = '';
  let unit = '';
  
  switch (service) {
    case 'signaturit':
      used = usage.signaturesUsed;
      limit = usage.planSignaturesLimit || 0;
      serviceName = 'firmas digitales';
      unit = 'firmas';
      break;
      
    case 's3':
      used = Math.round(usage.storageUsedGB * 100) / 100;
      limit = usage.planStorageLimit || 0;
      serviceName = 'almacenamiento';
      unit = 'GB';
      break;
      
    case 'claude':
      used = usage.aiTokensUsed;
      limit = usage.planAITokensLimit || 0;
      serviceName = 'IA (valoraciones y chat)';
      unit = 'tokens';
      break;
      
    case 'twilio':
      used = usage.smsUsed;
      limit = usage.planSMSLimit || 0;
      serviceName = 'SMS';
      unit = 'mensajes';
      break;
  }
  
  // Si no hay límite definido, bloquear
  if (limit === 0) {
    return {
      allowed: false,
      error: {
        error: 'Servicio no incluido en tu plan',
        message: `Tu plan actual no incluye ${serviceName}. Actualiza tu plan para acceder a esta funcionalidad.`,
        code: 'SERVICE_NOT_INCLUDED',
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  const percentage = getUsagePercentage(used, limit);
  const remaining = Math.max(0, limit - used);
  
  // Verificar si ha excedido
  const exceeded = requireExact ? used >= limit : used > limit;
  
  if (exceeded) {
    return {
      allowed: false,
      usage: {
        used,
        limit,
        percentage: 100,
        remaining: 0,
      },
      error: {
        error: 'Límite mensual alcanzado',
        message: `Has alcanzado el límite mensual de ${serviceName} (${used}/${limit} ${unit} usados). Tu cuota se renovará el próximo mes o puedes actualizar tu plan.`,
        code: 'LIMIT_EXCEEDED',
        details: {
          service,
          used,
          limit,
          period: usage.period,
        },
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  // Warning al 80%
  const warning = percentage >= 80 ? {
    message: `Estás usando el ${percentage}% de tu cuota mensual de ${serviceName} (${used}/${limit} ${unit}). Considera actualizar tu plan.`,
    percentage,
  } : undefined;
  
  return {
    allowed: true,
    usage: {
      used,
      limit,
      percentage,
      remaining,
    },
    warning,
  };
}

/**
 * Verifica límites para storage (con conversión de bytes a GB)
 * 
 * @param companyId - ID de la empresa
 * @param fileSizeBytes - Tamaño del archivo en bytes
 * 
 * @returns LimitCheckResult
 */
export async function checkStorageLimit(
  companyId: string,
  fileSizeBytes: number
): Promise<LimitCheckResult> {
  const usage = await getMonthlyUsage(companyId);
  
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const currentUsageGB = usage.storageUsedGB;
  const limit = usage.planStorageLimit || 0;
  
  if (limit === 0) {
    return {
      allowed: false,
      error: {
        error: 'Almacenamiento no incluido en tu plan',
        message: 'Tu plan actual no incluye almacenamiento en la nube. Actualiza tu plan para subir archivos.',
        code: 'SERVICE_NOT_INCLUDED',
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  const newTotalGB = currentUsageGB + fileSizeGB;
  
  if (newTotalGB > limit) {
    return {
      allowed: false,
      usage: {
        used: Math.round(currentUsageGB * 100) / 100,
        limit,
        percentage: getUsagePercentage(currentUsageGB, limit),
        remaining: Math.max(0, limit - currentUsageGB),
      },
      error: {
        error: 'Límite de almacenamiento excedido',
        message: `No puedes subir este archivo (${(fileSizeGB * 1024).toFixed(0)} MB). Has usado ${currentUsageGB.toFixed(2)}/${limit} GB y este archivo necesita ${fileSizeGB.toFixed(2)} GB más.`,
        code: 'STORAGE_LIMIT_EXCEEDED',
        details: {
          currentUsageGB: Math.round(currentUsageGB * 100) / 100,
          fileSizeGB: Math.round(fileSizeGB * 1000) / 1000,
          limitGB: limit,
        },
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  const percentage = getUsagePercentage(newTotalGB, limit);
  
  return {
    allowed: true,
    usage: {
      used: Math.round(currentUsageGB * 100) / 100,
      limit,
      percentage,
      remaining: Math.round((limit - newTotalGB) * 100) / 100,
    },
    warning: percentage >= 80 ? {
      message: `Después de subir este archivo, estarás usando el ${percentage}% de tu almacenamiento (${newTotalGB.toFixed(2)}/${limit} GB).`,
      percentage,
    } : undefined,
  };
}

/**
 * Verifica límites para IA (con estimación de tokens)
 * 
 * @param companyId - ID de la empresa
 * @param estimatedTokens - Tokens estimados para la operación
 * 
 * @returns LimitCheckResult
 */
export async function checkAILimit(
  companyId: string,
  estimatedTokens: number
): Promise<LimitCheckResult> {
  const usage = await getMonthlyUsage(companyId);
  
  const currentUsage = usage.aiTokensUsed;
  const limit = usage.planAITokensLimit || 0;
  
  if (limit === 0) {
    return {
      allowed: false,
      error: {
        error: 'IA no incluida en tu plan',
        message: 'Tu plan actual no incluye funcionalidades de IA. Actualiza tu plan para acceder a valoraciones automáticas y chat IA.',
        code: 'SERVICE_NOT_INCLUDED',
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  const newTotal = currentUsage + estimatedTokens;
  
  if (newTotal > limit) {
    return {
      allowed: false,
      usage: {
        used: currentUsage,
        limit,
        percentage: getUsagePercentage(currentUsage, limit),
        remaining: Math.max(0, limit - currentUsage),
      },
      error: {
        error: 'Límite de IA excedido',
        message: `Has alcanzado el límite mensual de uso de IA (${currentUsage.toLocaleString()}/${limit.toLocaleString()} tokens usados).`,
        code: 'AI_LIMIT_EXCEEDED',
        upgradeUrl: '/dashboard/billing',
      },
    };
  }
  
  const percentage = getUsagePercentage(newTotal, limit);
  
  return {
    allowed: true,
    usage: {
      used: currentUsage,
      limit,
      percentage,
      remaining: limit - newTotal,
    },
    warning: percentage >= 80 ? {
      message: `Estás usando el ${percentage}% de tu cuota mensual de IA (${currentUsage.toLocaleString()}/${limit.toLocaleString()} tokens).`,
      percentage,
    } : undefined,
  };
}

/**
 * Genera un response 429 (Too Many Requests) con detalles del límite
 */
export function createLimitExceededResponse(check: LimitCheckResult): NextResponse {
  return NextResponse.json(
    check.error,
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': check.usage?.limit?.toString() || '0',
        'X-RateLimit-Remaining': check.usage?.remaining?.toString() || '0',
        'X-RateLimit-Used': check.usage?.used?.toString() || '0',
        'Retry-After': getRetryAfterSeconds().toString(),
      },
    }
  );
}

/**
 * Calcula cuántos segundos hasta el próximo mes (reset de cuota)
 */
function getRetryAfterSeconds(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffMs = nextMonth.getTime() - now.getTime();
  return Math.ceil(diffMs / 1000);
}

/**
 * Helper para logging de warnings (cuando se alcanza el 80%)
 */
export function logUsageWarning(companyId: string, check: LimitCheckResult): void {
  if (check.warning) {
    logger.warn(`[Usage Warning] Company ${companyId}: ${check.warning.message}`);
    
    // TODO: Enviar email/notificación al cliente
    // await sendUsageWarningEmail(companyId, check.warning);
  }
}

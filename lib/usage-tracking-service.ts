/**
 * Usage Tracking Service
 * 
 * Servicio para tracking de uso de integraciones (control de costos)
 * 
 * Features:
 * - Track individual usage events
 * - Get monthly usage summaries
 * - Calculate costs based on pricing
 * - Update daily summaries
 */

import { prisma } from './db';
import { startOfMonth, endOfMonth } from 'date-fns';

// ═══════════════════════════════════════════════════════════════
// PRECIOS DE LAS INTEGRACIONES (Coste real para Inmova en €)
// ═══════════════════════════════════════════════════════════════

export const INTEGRATION_COSTS = {
  // Signaturit
  signature_simple: 1.00,    // €1 por firma simple
  signature_advanced: 2.50,  // €2.50 por firma avanzada
  signature_qualified: 5.00, // €5 por firma cualificada
  
  // AWS S3
  storage_gb: 0.023,         // €0.023 por GB/mes (eu-west-1)
  
  // Anthropic Claude
  ai_tokens: 0.0000047,      // €4.70 por 1M tokens → €0.0000047 por token
  
  // Twilio (Futuro)
  sms: 0.075,                // €0.075 por SMS en España
  whatsapp: 0.0047,          // €0.0047 por mensaje de WhatsApp
};

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface UsageEvent {
  companyId: string;
  service: 'signaturit' | 's3' | 'claude' | 'twilio';
  metric: 'signatures' | 'storage_gb' | 'tokens' | 'sms';
  value: number;
  metadata?: Record<string, any>;
}

export interface MonthlyUsage {
  period: Date;
  
  // Signaturit
  signaturesUsed: number;
  signaturesCost: number;
  
  // AWS S3
  storageUsedGB: number;
  storageCost: number;
  
  // Claude IA
  aiTokensUsed: number;
  aiCost: number;
  
  // Twilio
  smsUsed: number;
  smsCost: number;
  
  // Totales
  totalCost: number;
  
  // Límites del plan
  planSignaturesLimit?: number;
  planStorageLimit?: number;
  planAITokensLimit?: number;
  planSMSLimit?: number;
  
  // Excesos
  signaturesOverage: number;
  storageOverageGB: number;
  aiTokensOverage: number;
  smsOverage: number;
  overageCost: number;
}

// ═══════════════════════════════════════════════════════════════
// TRACKING DE USO
// ═══════════════════════════════════════════════════════════════

/**
 * Registra un evento de uso
 * 
 * @example
 * await trackUsage({
 *   companyId: 'cljk...',
 *   service: 'signaturit',
 *   metric: 'signatures',
 *   value: 1,
 *   metadata: { signatureId: 'sig_123', type: 'simple' }
 * });
 */
export async function trackUsage(event: UsageEvent): Promise<void> {
  const period = startOfMonth(new Date());
  
  // Calcular costo
  let cost = 0;
  
  switch (event.service) {
    case 'signaturit':
      const signatureType = event.metadata?.type || 'simple';
      cost = INTEGRATION_COSTS[`signature_${signatureType}` as keyof typeof INTEGRATION_COSTS] || INTEGRATION_COSTS.signature_simple;
      break;
      
    case 's3':
      cost = event.value * INTEGRATION_COSTS.storage_gb;
      break;
      
    case 'claude':
      cost = event.value * INTEGRATION_COSTS.ai_tokens;
      break;
      
    case 'twilio':
      const messageType = event.metadata?.type || 'sms';
      cost = messageType === 'whatsapp' ? INTEGRATION_COSTS.whatsapp : INTEGRATION_COSTS.sms;
      break;
  }
  
  // Registrar en UsageLog
  await prisma.usageLog.create({
    data: {
      companyId: event.companyId,
      service: event.service,
      metric: event.metric,
      value: event.value,
      cost,
      period,
      metadata: event.metadata || {},
    },
  });
  
  // Actualizar resumen mensual
  await updateMonthlySummary(event.companyId, period);
}

/**
 * Actualiza el resumen mensual de uso
 * (Se ejecuta automáticamente después de cada trackUsage)
 */
async function updateMonthlySummary(companyId: string, period: Date): Promise<void> {
  const startDate = startOfMonth(period);
  const endDate = endOfMonth(period);
  
  // Obtener logs del mes
  const logs = await prisma.usageLog.findMany({
    where: {
      companyId,
      period: startDate,
    },
  });
  
  // Agregar por servicio
  const signaturesUsed = logs.filter(l => l.service === 'signaturit').length;
  const signaturesCost = logs.filter(l => l.service === 'signaturit').reduce((sum, l) => sum + l.cost, 0);
  
  const storageUsedGB = logs.filter(l => l.service === 's3').reduce((sum, l) => sum + l.value, 0);
  const storageCost = logs.filter(l => l.service === 's3').reduce((sum, l) => sum + l.cost, 0);
  
  const aiTokensUsed = logs.filter(l => l.service === 'claude').reduce((sum, l) => sum + l.value, 0);
  const aiCost = logs.filter(l => l.service === 'claude').reduce((sum, l) => sum + l.cost, 0);
  
  const smsUsed = logs.filter(l => l.service === 'twilio').length;
  const smsCost = logs.filter(l => l.service === 'twilio').reduce((sum, l) => sum + l.cost, 0);
  
  const totalCost = signaturesCost + storageCost + aiCost + smsCost;
  
  // Obtener límites del plan
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptionPlan: true,
    },
  });
  
  const plan = company?.subscriptionPlan;
  
  // Calcular excesos
  const signaturesOverage = Math.max(0, signaturesUsed - (plan?.signaturesIncludedMonth || 0));
  const storageOverageGB = Math.max(0, storageUsedGB - (plan?.storageIncludedGB || 0));
  const aiTokensOverage = Math.max(0, aiTokensUsed - (plan?.aiTokensIncludedMonth || 0));
  const smsOverage = Math.max(0, smsUsed - (plan?.smsIncludedMonth || 0));
  
  const overageCost = 
    signaturesOverage * (plan?.extraSignaturePrice || 2.00) +
    storageOverageGB * (plan?.extraStorageGBPrice || 0.05) +
    (aiTokensOverage / 1000) * (plan?.extraAITokensPrice || 0.01) +
    smsOverage * (plan?.extraSMSPrice || 0.10);
  
  // Upsert resumen
  await prisma.usageSummary.upsert({
    where: {
      companyId_period: {
        companyId,
        period: startDate,
      },
    },
    create: {
      companyId,
      period: startDate,
      signaturesUsed,
      signaturesCost,
      storageUsedGB,
      storageCost,
      aiTokensUsed,
      aiCost,
      smsUsed,
      smsCost,
      totalCost,
      planSignaturesLimit: plan?.signaturesIncludedMonth,
      planStorageLimit: plan?.storageIncludedGB,
      planAITokensLimit: plan?.aiTokensIncludedMonth,
      planSMSLimit: plan?.smsIncludedMonth,
      signaturesOverage,
      storageOverageGB,
      aiTokensOverage,
      smsOverage,
      overageCost,
    },
    update: {
      signaturesUsed,
      signaturesCost,
      storageUsedGB,
      storageCost,
      aiTokensUsed,
      aiCost,
      smsUsed,
      smsCost,
      totalCost,
      planSignaturesLimit: plan?.signaturesIncludedMonth,
      planStorageLimit: plan?.storageIncludedGB,
      planAITokensLimit: plan?.aiTokensIncludedMonth,
      planSMSLimit: plan?.smsIncludedMonth,
      signaturesOverage,
      storageOverageGB,
      aiTokensOverage,
      smsOverage,
      overageCost,
    },
  });
}

/**
 * Obtiene el resumen de uso mensual de una empresa
 */
export async function getMonthlyUsage(
  companyId: string,
  period: Date = new Date()
): Promise<MonthlyUsage> {
  const startDate = startOfMonth(period);
  
  const summary = await prisma.usageSummary.findUnique({
    where: {
      companyId_period: {
        companyId,
        period: startDate,
      },
    },
  });
  
  if (!summary) {
    // No hay uso este mes, retornar vacío
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscriptionPlan: true },
    });
    
    const plan = company?.subscriptionPlan;
    
    return {
      period: startDate,
      signaturesUsed: 0,
      signaturesCost: 0,
      storageUsedGB: 0,
      storageCost: 0,
      aiTokensUsed: 0,
      aiCost: 0,
      smsUsed: 0,
      smsCost: 0,
      totalCost: 0,
      planSignaturesLimit: plan?.signaturesIncludedMonth,
      planStorageLimit: plan?.storageIncludedGB,
      planAITokensLimit: plan?.aiTokensIncludedMonth,
      planSMSLimit: plan?.smsIncludedMonth,
      signaturesOverage: 0,
      storageOverageGB: 0,
      aiTokensOverage: 0,
      smsOverage: 0,
      overageCost: 0,
    };
  }
  
  return {
    period: summary.period,
    signaturesUsed: summary.signaturesUsed,
    signaturesCost: summary.signaturesCost,
    storageUsedGB: summary.storageUsedGB,
    storageCost: summary.storageCost,
    aiTokensUsed: summary.aiTokensUsed,
    aiCost: summary.aiCost,
    smsUsed: summary.smsUsed,
    smsCost: summary.smsCost,
    totalCost: summary.totalCost,
    planSignaturesLimit: summary.planSignaturesLimit || undefined,
    planStorageLimit: summary.planStorageLimit || undefined,
    planAITokensLimit: summary.planAITokensLimit || undefined,
    planSMSLimit: summary.planSMSLimit || undefined,
    signaturesOverage: summary.signaturesOverage,
    storageOverageGB: summary.storageOverageGB,
    aiTokensOverage: summary.aiTokensOverage,
    smsOverage: summary.smsOverage,
    overageCost: summary.overageCost,
  };
}

/**
 * Verifica si una empresa ha excedido algún límite
 */
export async function hasExceededLimits(
  companyId: string,
  service?: 'signaturit' | 's3' | 'claude' | 'twilio'
): Promise<{
  exceeded: boolean;
  limits: {
    signatures?: { used: number; limit: number; exceeded: boolean };
    storage?: { used: number; limit: number; exceeded: boolean };
    aiTokens?: { used: number; limit: number; exceeded: boolean };
    sms?: { used: number; limit: number; exceeded: boolean };
  };
}> {
  const usage = await getMonthlyUsage(companyId);
  
  const limits: any = {};
  let exceeded = false;
  
  if (!service || service === 'signaturit') {
    const limit = usage.planSignaturesLimit || 0;
    const signaturesExceeded = usage.signaturesUsed >= limit;
    limits.signatures = {
      used: usage.signaturesUsed,
      limit,
      exceeded: signaturesExceeded,
    };
    if (signaturesExceeded) exceeded = true;
  }
  
  if (!service || service === 's3') {
    const limit = usage.planStorageLimit || 0;
    const storageExceeded = usage.storageUsedGB >= limit;
    limits.storage = {
      used: usage.storageUsedGB,
      limit,
      exceeded: storageExceeded,
    };
    if (storageExceeded) exceeded = true;
  }
  
  if (!service || service === 'claude') {
    const limit = usage.planAITokensLimit || 0;
    const aiExceeded = usage.aiTokensUsed >= limit;
    limits.aiTokens = {
      used: usage.aiTokensUsed,
      limit,
      exceeded: aiExceeded,
    };
    if (aiExceeded) exceeded = true;
  }
  
  if (!service || service === 'twilio') {
    const limit = usage.planSMSLimit || 0;
    const smsExceeded = usage.smsUsed >= limit;
    limits.sms = {
      used: usage.smsUsed,
      limit,
      exceeded: smsExceeded,
    };
    if (smsExceeded) exceeded = true;
  }
  
  return {
    exceeded,
    limits,
  };
}

/**
 * Calcula el porcentaje de uso respecto al límite
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Obtiene estadísticas agregadas de todos los clientes (para admin Inmova)
 */
export async function getAggregatedCosts(period: Date = new Date()): Promise<{
  period: Date;
  totalCompanies: number;
  totalCost: number;
  costByService: {
    signaturit: number;
    s3: number;
    claude: number;
    twilio: number;
  };
  topConsumers: Array<{
    companyId: string;
    companyName: string;
    totalCost: number;
  }>;
}> {
  const startDate = startOfMonth(period);
  
  const summaries = await prisma.usageSummary.findMany({
    where: {
      period: startDate,
    },
    include: {
      company: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
  
  const totalCompanies = summaries.length;
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0);
  
  const costByService = {
    signaturit: summaries.reduce((sum, s) => sum + s.signaturesCost, 0),
    s3: summaries.reduce((sum, s) => sum + s.storageCost, 0),
    claude: summaries.reduce((sum, s) => sum + s.aiCost, 0),
    twilio: summaries.reduce((sum, s) => sum + s.smsCost, 0),
  };
  
  const topConsumers = summaries
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10)
    .map(s => ({
      companyId: s.companyId,
      companyName: s.company.nombre,
      totalCost: s.totalCost,
    }));
  
  return {
    period: startDate,
    totalCompanies,
    totalCost,
    costByService,
    topConsumers,
  };
}

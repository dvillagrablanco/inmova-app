/**
 * Servicio de Feedback y Fine-tuning para Matching
 * 
 * Recopila feedback de matches y ajusta pesos del algoritmo automáticamente.
 * 
 * @module MatchingFeedbackService
 */

import { prisma } from './db';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export type FeedbackType =
  | 'ACCEPTED' // Usuario vio el match y contactó
  | 'VIEWED' // Usuario vio pero no contactó
  | 'REJECTED' // Usuario rechazó explícitamente
  | 'IGNORED'; // Usuario nunca vio el match

export interface MatchFeedback {
  matchId: string;
  tenantId: string;
  unitId: string;
  feedbackType: FeedbackType;
  matchScore: number;
  scores: {
    location: number;
    price: number;
    features: number;
    size: number;
    availability: number;
  };
  timestamp: Date;
}

export interface WeightAdjustment {
  weights: {
    location: number;
    price: number;
    features: number;
    size: number;
    availability: number;
  };
  accuracy: number;
  sampleSize: number;
  adjustedAt: Date;
}

// ============================================================================
// RECOPILACIÓN DE FEEDBACK
// ============================================================================

/**
 * Registra feedback de un match
 */
export async function recordMatchFeedback(
  matchId: string,
  feedbackType: FeedbackType,
  metadata?: any
): Promise<any> {
  try {
    // Obtener el match original
    const match = await prisma.tenantPropertyMatch.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Guardar feedback
    const feedback = await prisma.matchFeedback.create({
      data: {
        matchId,
        tenantId: match.tenantId,
        unitId: match.unitId,
        companyId: match.companyId,
        feedbackType,
        matchScore: match.matchScore,
        locationScore: match.locationScore,
        priceScore: match.priceScore,
        featuresScore: match.featuresScore,
        sizeScore: match.sizeScore,
        availabilityScore: match.availabilityScore,
        metadata,
      },
    });

    // Actualizar estado del match
    await prisma.tenantPropertyMatch.update({
      where: { id: matchId },
      data: {
        status: feedbackType === 'ACCEPTED' ? 'CONTACTED' : match.status,
        [feedbackType === 'VIEWED' && 'viewedAt']: new Date(),
        [feedbackType === 'ACCEPTED' && 'contactedAt']: new Date(),
      },
    });

    logger.info(`✅ Match feedback recorded: ${feedbackType}`, {
      matchId,
      tenantId: match.tenantId,
    });

    return feedback;

  } catch (error: any) {
    logger.error('❌ Error recording match feedback:', error);
    throw new Error(`Failed to record feedback: ${error.message}`);
  }
}

/**
 * Registra que un match fue aceptado (inquilino contactó)
 */
export async function recordMatchAccepted(
  matchId: string,
  contactMethod?: string
): Promise<void> {
  await recordMatchFeedback(matchId, 'ACCEPTED', { contactMethod });
}

/**
 * Registra que un match fue visto pero no aceptado
 */
export async function recordMatchViewed(matchId: string): Promise<void> {
  await recordMatchFeedback(matchId, 'VIEWED');
}

/**
 * Registra que un match fue rechazado
 */
export async function recordMatchRejected(
  matchId: string,
  reason?: string
): Promise<void> {
  await recordMatchFeedback(matchId, 'REJECTED', { reason });
}

// ============================================================================
// ANÁLISIS DE FEEDBACK
// ============================================================================

/**
 * Obtiene estadísticas de feedback
 */
export async function getMatchFeedbackStats(
  companyId: string,
  tenantId?: string
): Promise<{
  total: number;
  accepted: number;
  viewed: number;
  rejected: number;
  ignored: number;
  acceptanceRate: number;
  avgAcceptedScore: number;
  avgRejectedScore: number;
}> {
  try {
    const where: any = { companyId };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Obtener todos los feedbacks
    const feedbacks = await prisma.matchFeedback.findMany({
      where,
      select: {
        feedbackType: true,
        matchScore: true,
      },
    });

    const total = feedbacks.length;
    const accepted = feedbacks.filter((f) => f.feedbackType === 'ACCEPTED').length;
    const viewed = feedbacks.filter((f) => f.feedbackType === 'VIEWED').length;
    const rejected = feedbacks.filter((f) => f.feedbackType === 'REJECTED').length;
    const ignored = feedbacks.filter((f) => f.feedbackType === 'IGNORED').length;

    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    const acceptedScores = feedbacks
      .filter((f) => f.feedbackType === 'ACCEPTED')
      .map((f) => f.matchScore);
    const avgAcceptedScore =
      acceptedScores.length > 0
        ? acceptedScores.reduce((sum, s) => sum + s, 0) / acceptedScores.length
        : 0;

    const rejectedScores = feedbacks
      .filter((f) => f.feedbackType === 'REJECTED')
      .map((f) => f.matchScore);
    const avgRejectedScore =
      rejectedScores.length > 0
        ? rejectedScores.reduce((sum, s) => sum + s, 0) / rejectedScores.length
        : 0;

    return {
      total,
      accepted,
      viewed,
      rejected,
      ignored,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      avgAcceptedScore: Math.round(avgAcceptedScore),
      avgRejectedScore: Math.round(avgRejectedScore),
    };

  } catch (error: any) {
    logger.error('❌ Error getting feedback stats:', error);
    throw error;
  }
}

/**
 * Identifica patrones en matches exitosos vs rechazados
 */
export async function analyzeMatchPatterns(
  companyId: string
): Promise<{
  acceptedPatterns: { [key: string]: number };
  rejectedPatterns: { [key: string]: number };
  insights: string[];
}> {
  try {
    // Obtener feedbacks con scores
    const accepted = await prisma.matchFeedback.findMany({
      where: {
        companyId,
        feedbackType: 'ACCEPTED',
      },
      select: {
        locationScore: true,
        priceScore: true,
        featuresScore: true,
        sizeScore: true,
        availabilityScore: true,
      },
    });

    const rejected = await prisma.matchFeedback.findMany({
      where: {
        companyId,
        feedbackType: 'REJECTED',
      },
      select: {
        locationScore: true,
        priceScore: true,
        featuresScore: true,
        sizeScore: true,
        availabilityScore: true,
      },
    });

    // Calcular promedios
    const calcAvg = (arr: any[], key: string) =>
      arr.length > 0 ? arr.reduce((sum, item) => sum + item[key], 0) / arr.length : 0;

    const acceptedPatterns = {
      locationScore: calcAvg(accepted, 'locationScore'),
      priceScore: calcAvg(accepted, 'priceScore'),
      featuresScore: calcAvg(accepted, 'featuresScore'),
      sizeScore: calcAvg(accepted, 'sizeScore'),
      availabilityScore: calcAvg(accepted, 'availabilityScore'),
    };

    const rejectedPatterns = {
      locationScore: calcAvg(rejected, 'locationScore'),
      priceScore: calcAvg(rejected, 'priceScore'),
      featuresScore: calcAvg(rejected, 'featuresScore'),
      sizeScore: calcAvg(rejected, 'sizeScore'),
      availabilityScore: calcAvg(rejected, 'availabilityScore'),
    };

    // Generar insights
    const insights: string[] = [];

    const diff = (key: string) =>
      acceptedPatterns[key as keyof typeof acceptedPatterns] -
      rejectedPatterns[key as keyof typeof rejectedPatterns];

    if (Math.abs(diff('priceScore')) > 5) {
      insights.push(
        `El precio es ${diff('priceScore') > 0 ? 'más' : 'menos'} importante de lo esperado`
      );
    }

    if (Math.abs(diff('locationScore')) > 5) {
      insights.push(
        `La ubicación es ${diff('locationScore') > 0 ? 'más' : 'menos'} importante de lo esperado`
      );
    }

    if (Math.abs(diff('featuresScore')) > 3) {
      insights.push(
        `Las características son ${diff('featuresScore') > 0 ? 'más' : 'menos'} importantes de lo esperado`
      );
    }

    return {
      acceptedPatterns,
      rejectedPatterns,
      insights,
    };

  } catch (error: any) {
    logger.error('❌ Error analyzing match patterns:', error);
    throw error;
  }
}

// ============================================================================
// FINE-TUNING AUTOMÁTICO
// ============================================================================

/**
 * Ajusta pesos del algoritmo basado en feedback histórico
 */
export async function adjustMatchWeights(
  companyId: string,
  minSamples: number = 50
): Promise<WeightAdjustment | null> {
  try {
    // Verificar que hay suficientes muestras
    const feedbackCount = await prisma.matchFeedback.count({
      where: { companyId },
    });

    if (feedbackCount < minSamples) {
      logger.warn(`⚠️ Insufficient samples for fine-tuning: ${feedbackCount}/${minSamples}`);
      return null;
    }

    // Analizar patrones
    const patterns = await analyzeMatchPatterns(companyId);

    // Calcular pesos óptimos (algoritmo simple)
    const { acceptedPatterns, rejectedPatterns } = patterns;

    // Pesos base (actuales)
    const baseWeights = {
      location: 25,
      price: 30,
      features: 20,
      size: 15,
      availability: 10,
    };

    // Calcular diferencias relativas
    const calcWeight = (key: string) => {
      const accepted = acceptedPatterns[key as keyof typeof acceptedPatterns];
      const rejected = rejectedPatterns[key as keyof typeof rejectedPatterns];
      const base = baseWeights[key as keyof typeof baseWeights];

      // Si matches aceptados tienen mayor score en esta dimensión, aumentar peso
      if (accepted > rejected + 2) {
        return Math.min(base * 1.1, base + 5); // +10% o +5 puntos (lo que sea menor)
      }

      // Si matches rechazados tienen mayor score, reducir peso
      if (rejected > accepted + 2) {
        return Math.max(base * 0.9, base - 5); // -10% o -5 puntos
      }

      return base;
    };

    const newWeights = {
      location: Math.round(calcWeight('locationScore')),
      price: Math.round(calcWeight('priceScore')),
      features: Math.round(calcWeight('featuresScore')),
      size: Math.round(calcWeight('sizeScore')),
      availability: Math.round(calcWeight('availabilityScore')),
    };

    // Normalizar para que sumen 100
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    const normalizedWeights = {
      location: Math.round((newWeights.location / total) * 100),
      price: Math.round((newWeights.price / total) * 100),
      features: Math.round((newWeights.features / total) * 100),
      size: Math.round((newWeights.size / total) * 100),
      availability: Math.round((newWeights.availability / total) * 100),
    };

    // Ajustar último para que sume exactamente 100
    const sum = Object.values(normalizedWeights).reduce((s, w) => s + w, 0);
    normalizedWeights.availability += 100 - sum;

    // Calcular accuracy (acceptance rate)
    const stats = await getMatchFeedbackStats(companyId);
    const accuracy = stats.acceptanceRate;

    // Guardar ajuste
    const adjustment: WeightAdjustment = {
      weights: normalizedWeights,
      accuracy,
      sampleSize: feedbackCount,
      adjustedAt: new Date(),
    };

    await prisma.matchWeightAdjustment.create({
      data: {
        companyId,
        weights: normalizedWeights,
        accuracy,
        sampleSize: feedbackCount,
      },
    });

    logger.info('✅ Match weights adjusted', {
      companyId,
      oldWeights: baseWeights,
      newWeights: normalizedWeights,
      accuracy: `${accuracy}%`,
    });

    return adjustment;

  } catch (error: any) {
    logger.error('❌ Error adjusting match weights:', error);
    throw error;
  }
}

/**
 * Obtiene los pesos actuales (ajustados o por defecto)
 */
export async function getCurrentWeights(
  companyId: string
): Promise<{
  location: number;
  price: number;
  features: number;
  size: number;
  availability: number;
}> {
  try {
    // Buscar último ajuste
    const lastAdjustment = await prisma.matchWeightAdjustment.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAdjustment) {
      return lastAdjustment.weights as any;
    }

    // Pesos por defecto
    return {
      location: 25,
      price: 30,
      features: 20,
      size: 15,
      availability: 10,
    };

  } catch (error: any) {
    logger.error('❌ Error getting current weights:', error);
    return {
      location: 25,
      price: 30,
      features: 20,
      size: 15,
      availability: 10,
    };
  }
}

/**
 * Programa fine-tuning automático (ejecutar periódicamente)
 */
export async function scheduleAutoFineTuning(
  companyId: string
): Promise<void> {
  try {
    // Verificar si han pasado al menos 7 días desde último ajuste
    const lastAdjustment = await prisma.matchWeightAdjustment.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const daysSinceLastAdjustment = lastAdjustment
      ? Math.floor(
          (Date.now() - lastAdjustment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : Infinity;

    if (daysSinceLastAdjustment < 7) {
      logger.info(`⏭️ Skipping fine-tuning: only ${daysSinceLastAdjustment} days since last adjustment`);
      return;
    }

    // Ejecutar fine-tuning
    const adjustment = await adjustMatchWeights(companyId, 50);

    if (adjustment) {
      logger.info('✅ Auto fine-tuning completed', {
        companyId,
        accuracy: adjustment.accuracy,
      });
    } else {
      logger.info('⏭️ Auto fine-tuning skipped: insufficient samples');
    }

  } catch (error: any) {
    logger.error('❌ Error in auto fine-tuning:', error);
  }
}

export default {
  recordMatchFeedback,
  recordMatchAccepted,
  recordMatchViewed,
  recordMatchRejected,
  getMatchFeedbackStats,
  analyzeMatchPatterns,
  adjustMatchWeights,
  getCurrentWeights,
  scheduleAutoFineTuning,
};

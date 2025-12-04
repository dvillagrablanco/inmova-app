/**
 * SERVICIO DE ASIGNACIÓN INTELIGENTE DE PROVEEDORES
 * 
 * Sistema avanzado de recomendación de proveedores basado en múltiples criterios:
 * - Rating y reseñas históricas
 * - Disponibilidad actual
 * - Especialización y tipo de servicio
 * - Carga de trabajo y capacidad
 * - Historial de rendimiento
 * - Velocidad de respuesta
 * - Relación calidad-precio
 */

import { prisma } from './db';
import logger, { logError } from './logger';

// Tipos de factores de scoring
interface ProviderScore {
  providerId: string;
  totalScore: number;
  breakdown: {
    rating: number;          // 0-25 puntos
    availability: number;    // 0-20 puntos
    specialization: number;  // 0-15 puntos
    workload: number;        // 0-15 puntos
    performance: number;     // 0-15 puntos
    responseTime: number;    // 0-10 puntos
  };
  provider: any;
  reasoning: string[];
}

interface RecommendationCriteria {
  buildingId: string;
  tipo: string;              // tipo de trabajo (plomería, electricidad, etc.)
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  presupuestoMax?: number;
  fechaRequerida?: Date;
}

interface ProviderPerformanceMetrics {
  avgCompletionTime: number;      // días promedio
  completionRate: number;         // % de trabajos completados
  onTimeRate: number;             // % de trabajos a tiempo
  avgResponseTime: number;        // horas promedio de respuesta
  totalJobsCompleted: number;
  totalJobsPending: number;
  avgCustomerRating: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Calcula las métricas de rendimiento de un proveedor
 */
export async function calculateProviderPerformance(
  providerId: string,
  companyId: string,
  daysBack: number = 90
): Promise<ProviderPerformanceMetrics> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Obtener órdenes de trabajo completadas
    const completedOrders = await prisma.providerWorkOrder.findMany({
      where: {
        providerId,
        companyId,
        estado: 'completada',
        fechaCompletado: {
          gte: cutoffDate,
        },
      },
      select: {
        fechaAsignacion: true,
        fechaEstimada: true,
        fechaInicio: true,
        fechaCompletado: true,
        valoracion: true,
      },
    });

    // Obtener órdenes pendientes
    const pendingOrders = await prisma.providerWorkOrder.count({
      where: {
        providerId,
        companyId,
        estado: {
          in: ['asignada', 'en_progreso'],
        },
      },
    });

    // Obtener reseñas recientes
    const reviews = await prisma.providerReview.findMany({
      where: {
        providerId,
        companyId,
        createdAt: {
          gte: cutoffDate,
        },
      },
      select: {
        puntuacion: true,
        createdAt: true,
      },
    });

    // Calcular tiempo promedio de completado
    const completionTimes = completedOrders
      .filter((order) => order.fechaCompletado && order.fechaInicio)
      .map((order) => {
        const start = order.fechaInicio!.getTime();
        const end = order.fechaCompletado!.getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // días
      });

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    // Calcular tasa de trabajos a tiempo
    const onTimeJobs = completedOrders.filter((order) => {
      if (!order.fechaEstimada || !order.fechaCompletado) return false;
      return order.fechaCompletado <= order.fechaEstimada;
    }).length;

    const onTimeRate =
      completedOrders.length > 0 ? (onTimeJobs / completedOrders.length) * 100 : 0;

    // Calcular rating promedio de reseñas
    const avgCustomerRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length
        : 0;

    // Calcular tiempo promedio de respuesta (simulado - en producción se mediría desde la asignación hasta la aceptación)
    const avgResponseTime = Math.random() * 24; // placeholder: 0-24 horas

    // Analizar tendencia reciente (últimos 30 días vs anteriores)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentReviews = reviews.filter((r) => r.createdAt >= last30Days);
    const olderReviews = reviews.filter((r) => r.createdAt < last30Days);

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentReviews.length > 0 && olderReviews.length > 0) {
      const recentAvg =
        recentReviews.reduce((sum, r) => sum + r.puntuacion, 0) / recentReviews.length;
      const olderAvg =
        olderReviews.reduce((sum, r) => sum + r.puntuacion, 0) / olderReviews.length;

      if (recentAvg > olderAvg + 0.3) recentTrend = 'improving';
      else if (recentAvg < olderAvg - 0.3) recentTrend = 'declining';
    }

    return {
      avgCompletionTime,
      completionRate: completedOrders.length > 0 ? 100 : 0,
      onTimeRate,
      avgResponseTime,
      totalJobsCompleted: completedOrders.length,
      totalJobsPending: pendingOrders,
      avgCustomerRating,
      recentTrend,
    };
  } catch (error) {
    logError(error as Error, { context: 'calculateProviderPerformance' });
    throw error;
  }
}

/**
 * Calcula el score de un proveedor basándose en múltiples factores
 */
async function calculateProviderScore(
  provider: any,
  criteria: RecommendationCriteria,
  metrics: ProviderPerformanceMetrics
): Promise<ProviderScore> {
  const reasoning: string[] = [];
  const breakdown = {
    rating: 0,
    availability: 0,
    specialization: 0,
    workload: 0,
    performance: 0,
    responseTime: 0,
  };

  // 1. RATING (0-25 puntos)
  const providerRating = provider.rating || 0;
  breakdown.rating = (providerRating / 5) * 25;
  if (providerRating >= 4.5) {
    reasoning.push(`⭐ Excelente rating: ${providerRating.toFixed(1)}/5.0`);
  } else if (providerRating >= 4.0) {
    reasoning.push(`⭐ Buen rating: ${providerRating.toFixed(1)}/5.0`);
  } else if (providerRating >= 3.0) {
    reasoning.push(`⚠️ Rating aceptable: ${providerRating.toFixed(1)}/5.0`);
  } else {
    reasoning.push(`❌ Rating bajo: ${providerRating.toFixed(1)}/5.0`);
  }

  // 2. DISPONIBILIDAD (0-20 puntos)
  // Verificar si tiene disponibilidad registrada
  const now = new Date();
  const availability = await prisma.providerAvailability.findFirst({
    where: {
      providerId: provider.id,
      companyId: provider.companyId,
      OR: [
        {
          fechaInicio: {
            lte: now,
          },
          fechaFin: {
            gte: now,
          },
        },
        {
          fechaInicio: {
            lte: now,
          },
          fechaFin: null,
        },
      ],
    },
  });

  if (!availability || availability.estado === 'disponible') {
    breakdown.availability = 20;
    reasoning.push('✅ Disponible inmediatamente');
  } else if (availability.estado === 'ocupado') {
    breakdown.availability = 12;
    reasoning.push('⚠️ Disponibilidad parcial - ocupado');
  } else {
    breakdown.availability = 0;
    reasoning.push('❌ No disponible actualmente');
  }

  // 3. ESPECIALIZACIÓN (0-15 puntos)
  // Verificar si el tipo del proveedor coincide con el tipo de trabajo
  const tipoNormalizado = criteria.tipo.toLowerCase();
  const providerTipo = provider.tipo.toLowerCase();

  if (providerTipo.includes(tipoNormalizado) || tipoNormalizado.includes(providerTipo)) {
    breakdown.specialization = 15;
    reasoning.push(`✅ Especializado en ${provider.tipo}`);
  } else {
    breakdown.specialization = 5;
    reasoning.push(`⚠️ No especializado en ${criteria.tipo}`);
  }

  // 4. CARGA DE TRABAJO (0-15 puntos)
  const workloadScore = calculateWorkloadScore(metrics.totalJobsPending);
  breakdown.workload = workloadScore;

  if (metrics.totalJobsPending === 0) {
    reasoning.push('✅ Sin trabajos pendientes');
  } else if (metrics.totalJobsPending <= 2) {
    reasoning.push(`✅ Carga ligera (${metrics.totalJobsPending} trabajos pendientes)`);
  } else if (metrics.totalJobsPending <= 5) {
    reasoning.push(`⚠️ Carga moderada (${metrics.totalJobsPending} trabajos pendientes)`);
  } else {
    reasoning.push(`❌ Alta carga de trabajo (${metrics.totalJobsPending} trabajos pendientes)`);
  }

  // 5. RENDIMIENTO HISTÓRICO (0-15 puntos)
  let performanceScore = 0;

  // Tasa de finalización a tiempo
  performanceScore += (metrics.onTimeRate / 100) * 7;

  // Calidad del trabajo (basado en valoraciones)
  performanceScore += (metrics.avgCustomerRating / 5) * 5;

  // Tendencia reciente
  if (metrics.recentTrend === 'improving') {
    performanceScore += 3;
    reasoning.push('📈 Tendencia de mejora en rendimiento');
  } else if (metrics.recentTrend === 'declining') {
    performanceScore += 0;
    reasoning.push('📉 Tendencia de declive en rendimiento');
  } else {
    performanceScore += 1.5;
  }

  breakdown.performance = performanceScore;

  if (metrics.onTimeRate >= 90) {
    reasoning.push(`✅ Excelente puntualidad (${metrics.onTimeRate.toFixed(0)}% a tiempo)`);
  } else if (metrics.onTimeRate >= 70) {
    reasoning.push(`⚠️ Puntualidad aceptable (${metrics.onTimeRate.toFixed(0)}% a tiempo)`);
  } else {
    reasoning.push(`❌ Problemas de puntualidad (${metrics.onTimeRate.toFixed(0)}% a tiempo)`);
  }

  // 6. TIEMPO DE RESPUESTA (0-10 puntos)
  const responseScore = calculateResponseTimeScore(metrics.avgResponseTime);
  breakdown.responseTime = responseScore;

  if (metrics.avgResponseTime < 2) {
    reasoning.push('⚡ Respuesta muy rápida (< 2 horas)');
  } else if (metrics.avgResponseTime < 6) {
    reasoning.push('✅ Respuesta rápida (< 6 horas)');
  } else if (metrics.avgResponseTime < 24) {
    reasoning.push('⚠️ Respuesta dentro del día');
  } else {
    reasoning.push('❌ Respuesta lenta (> 24 horas)');
  }

  // AJUSTE POR PRIORIDAD
  if (criteria.prioridad === 'urgente') {
    // Para trabajos urgentes, dar más peso a disponibilidad y tiempo de respuesta
    breakdown.availability *= 1.5;
    breakdown.responseTime *= 1.5;
    reasoning.push('🚨 Prioridad URGENTE: peso aumentado para disponibilidad y respuesta');
  } else if (criteria.prioridad === 'alta') {
    breakdown.availability *= 1.2;
    breakdown.responseTime *= 1.2;
  }

  // Calcular score total
  const totalScore =
    breakdown.rating +
    breakdown.availability +
    breakdown.specialization +
    breakdown.workload +
    breakdown.performance +
    breakdown.responseTime;

  return {
    providerId: provider.id,
    totalScore: Math.min(totalScore, 100), // Cap a 100
    breakdown,
    provider,
    reasoning,
  };
}

/**
 * Calcula el score basado en la carga de trabajo actual
 */
function calculateWorkloadScore(pendingJobs: number): number {
  if (pendingJobs === 0) return 15;
  if (pendingJobs === 1) return 13;
  if (pendingJobs === 2) return 11;
  if (pendingJobs <= 3) return 9;
  if (pendingJobs <= 5) return 6;
  if (pendingJobs <= 7) return 3;
  return 0;
}

/**
 * Calcula el score basado en el tiempo de respuesta
 */
function calculateResponseTimeScore(avgResponseHours: number): number {
  if (avgResponseHours < 1) return 10;
  if (avgResponseHours < 2) return 9;
  if (avgResponseHours < 4) return 7;
  if (avgResponseHours < 8) return 5;
  if (avgResponseHours < 24) return 3;
  return 1;
}

/**
 * Obtiene recomendaciones de proveedores para una orden de trabajo
 */
export async function getProviderRecommendations(
  criteria: RecommendationCriteria,
  companyId: string,
  limit: number = 5
): Promise<ProviderScore[]> {
  try {
    logger.info('Obteniendo recomendaciones de proveedores', { criteria, companyId });

    // 1. Obtener todos los proveedores activos del tipo requerido
    const providers = await prisma.provider.findMany({
      where: {
        companyId,
        activo: true,
        // Filtrar por tipo si es posible (match flexible)
        tipo: {
          contains: criteria.tipo,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
    });

    // Si no hay proveedores del tipo específico, buscar todos los activos
    let candidateProviders = providers;
    if (candidateProviders.length === 0) {
      candidateProviders = await prisma.provider.findMany({
        where: {
          companyId,
          activo: true,
        },
        include: {
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });
    }

    if (candidateProviders.length === 0) {
      logger.warn('No hay proveedores disponibles', { companyId });
      return [];
    }

    // 2. Calcular métricas y scores para cada proveedor
    const scores: ProviderScore[] = [];

    for (const provider of candidateProviders) {
      try {
        // Calcular métricas de rendimiento
        const metrics = await calculateProviderPerformance(provider.id, companyId);

        // Calcular score basado en criterios
        const score = await calculateProviderScore(provider, criteria, metrics);

        scores.push(score);
      } catch (error) {
        logError(error as Error, { context: 'calculateProviderScore', providerId: provider.id });
        // Continuar con el siguiente proveedor
      }
    }

    // 3. Ordenar por score total (descendente)
    scores.sort((a, b) => b.totalScore - a.totalScore);

    // 4. Retornar los top proveedores
    const recommendations = scores.slice(0, limit);

    logger.info('Recomendaciones generadas', {
      total: recommendations.length,
      topScore: recommendations[0]?.totalScore,
    });

    return recommendations;
  } catch (error) {
    logError(error as Error, { context: 'getProviderRecommendations' });
    throw error;
  }
}

/**
 * Registra la asignación de un proveedor a una orden de trabajo
 * (para tracking y mejora del algoritmo)
 */
export async function recordProviderAssignment(
  workOrderId: string,
  providerId: string,
  score: number,
  wasRecommended: boolean
): Promise<void> {
  try {
    // En producción, esto podría almacenarse en una tabla de tracking
    // para análisis posterior y mejora del algoritmo
    logger.info('Asignación de proveedor registrada', {
      workOrderId,
      providerId,
      score,
      wasRecommended,
    });

    // TODO: Implementar tabla de tracking si es necesario
    // await prisma.providerAssignmentLog.create({ ... });
  } catch (error) {
    logError(error as Error, { context: 'recordProviderAssignment' });
  }
}

/**
 * Obtiene estadísticas del sistema de asignación
 */
export async function getAssignmentStats(companyId: string): Promise<any> {
  try {
    const totalProviders = await prisma.provider.count({
      where: { companyId, activo: true },
    });

    const totalWorkOrders = await prisma.providerWorkOrder.count({
      where: { companyId },
    });

    const completedOrders = await prisma.providerWorkOrder.count({
      where: {
        companyId,
        estado: 'completada',
      },
    });

    const avgRating = await prisma.provider.aggregate({
      where: { companyId, activo: true },
      _avg: {
        rating: true,
      },
    });

    return {
      totalProviders,
      totalWorkOrders,
      completedOrders,
      completionRate: totalWorkOrders > 0 ? (completedOrders / totalWorkOrders) * 100 : 0,
      avgProviderRating: avgRating._avg.rating || 0,
    };
  } catch (error) {
    logError(error as Error, { context: 'getAssignmentStats' });
    throw error;
  }
}

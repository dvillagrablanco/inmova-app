/**
 * API ENDPOINT: Métricas de Rendimiento de Proveedor
 *
 * GET /api/providers/performance/[id]
 *
 * Obtiene las métricas detalladas de rendimiento de un proveedor específico.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { calculateProviderPerformance } from '@/lib/provider-assignment-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const providerId = params.id;

    if (!providerId) {
      return NextResponse.json({ error: 'ID de proveedor requerido' }, { status: 400 });
    }

    // Extraer parámetro de días desde query string
    const { searchParams } = new URL(req.url);
    const daysBack = parseInt(searchParams.get('days') || '90', 10);

    logger.info('Solicitando métricas de rendimiento de proveedor', {
      userId: user.id,
      providerId,
      daysBack,
    });

    // Calcular métricas
    const metrics = await calculateProviderPerformance(providerId, user.companyId, daysBack);

    // Formatear respuesta
    const response = {
      providerId,
      period: {
        days: daysBack,
        from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      metrics: {
        completion: {
          avgTime: parseFloat(metrics.avgCompletionTime.toFixed(2)),
          rate: parseFloat(metrics.completionRate.toFixed(2)),
          onTimeRate: parseFloat(metrics.onTimeRate.toFixed(2)),
        },
        workload: {
          completed: metrics.totalJobsCompleted,
          pending: metrics.totalJobsPending,
        },
        quality: {
          avgRating: parseFloat(metrics.avgCustomerRating.toFixed(2)),
          trend: metrics.recentTrend,
        },
        responsiveness: {
          avgResponseTime: parseFloat(metrics.avgResponseTime.toFixed(2)),
        },
      },
      analysis: generatePerformanceAnalysis(metrics),
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    logError(new Error(error.message || 'Error obteniendo métricas de rendimiento'), {
      context: 'GET /api/providers/performance/[id]',
    });

    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener métricas',
      },
      { status: 500 }
    );
  }
}

/**
 * Genera análisis textual del rendimiento del proveedor
 */
function generatePerformanceAnalysis(metrics: any): string[] {
  const analysis: string[] = [];

  // Análisis de puntualidad
  if (metrics.onTimeRate >= 90) {
    analysis.push('Excelente historial de puntualidad en entregas');
  } else if (metrics.onTimeRate >= 70) {
    analysis.push('Puntualidad aceptable, con margen de mejora');
  } else if (metrics.onTimeRate < 70 && metrics.totalJobsCompleted > 0) {
    analysis.push('Problemas recurrentes de puntualidad');
  }

  // Análisis de calidad
  if (metrics.avgCustomerRating >= 4.5) {
    analysis.push('Calidad de trabajo excepcional según clientes');
  } else if (metrics.avgCustomerRating >= 4.0) {
    analysis.push('Buena calidad de trabajo');
  } else if (metrics.avgCustomerRating >= 3.0) {
    analysis.push('Calidad de trabajo aceptable');
  } else if (metrics.avgCustomerRating > 0) {
    analysis.push('Calidad de trabajo por debajo de expectativas');
  }

  // Análisis de tendencia
  if (metrics.recentTrend === 'improving') {
    analysis.push('Tendencia positiva: mejora continua en el rendimiento');
  } else if (metrics.recentTrend === 'declining') {
    analysis.push('Tendencia negativa: declive en el rendimiento reciente');
  }

  // Análisis de carga de trabajo
  if (metrics.totalJobsPending === 0) {
    analysis.push('Sin carga de trabajo actual - disponible inmediatamente');
  } else if (metrics.totalJobsPending <= 3) {
    analysis.push('Carga de trabajo ligera - buena disponibilidad');
  } else if (metrics.totalJobsPending <= 6) {
    analysis.push('Carga de trabajo moderada');
  } else {
    analysis.push('Alta carga de trabajo actual');
  }

  // Análisis de experiencia
  if (metrics.totalJobsCompleted >= 50) {
    analysis.push('Proveedor altamente experimentado');
  } else if (metrics.totalJobsCompleted >= 20) {
    analysis.push('Proveedor con buena experiencia');
  } else if (metrics.totalJobsCompleted >= 5) {
    analysis.push('Proveedor con experiencia moderada');
  } else if (metrics.totalJobsCompleted > 0) {
    analysis.push('Proveedor con experiencia limitada');
  } else {
    analysis.push('Proveedor sin historial registrado');
  }

  return analysis;
}

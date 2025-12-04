/**
 * API ENDPOINT: Recomendaciones Inteligentes de Proveedores
 * 
 * POST /api/providers/recommend
 * 
 * Obtiene recomendaciones de proveedores basadas en múltiples criterios
 * usando el sistema de asignación inteligente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, badRequestResponse } from '@/lib/permissions';
import { getProviderRecommendations } from '@/lib/provider-assignment-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { buildingId, tipo, prioridad, presupuestoMax, fechaRequerida, limit } = body;

    // Validar campos requeridos
    if (!buildingId || !tipo || !prioridad) {
      return badRequestResponse('Se requieren buildingId, tipo y prioridad');
    }

    // Validar prioridad
    if (!['baja', 'media', 'alta', 'urgente'].includes(prioridad)) {
      return badRequestResponse('Prioridad debe ser: baja, media, alta o urgente');
    }

    logger.info('Solicitando recomendaciones de proveedores', {
      userId: user.id,
      companyId: user.companyId,
      tipo,
      prioridad,
    });

    // Obtener recomendaciones
    const recommendations = await getProviderRecommendations(
      {
        buildingId,
        tipo,
        prioridad,
        presupuestoMax: presupuestoMax ? parseFloat(presupuestoMax) : undefined,
        fechaRequerida: fechaRequerida ? new Date(fechaRequerida) : undefined,
      },
      user.companyId,
      limit || 5
    );

    // Formatear respuesta
    const response = recommendations.map((rec) => ({
      provider: {
        id: rec.provider.id,
        nombre: rec.provider.nombre,
        tipo: rec.provider.tipo,
        telefono: rec.provider.telefono,
        email: rec.provider.email,
        rating: rec.provider.rating,
      },
      score: {
        total: parseFloat(rec.totalScore.toFixed(2)),
        breakdown: {
          rating: parseFloat(rec.breakdown.rating.toFixed(2)),
          availability: parseFloat(rec.breakdown.availability.toFixed(2)),
          specialization: parseFloat(rec.breakdown.specialization.toFixed(2)),
          workload: parseFloat(rec.breakdown.workload.toFixed(2)),
          performance: parseFloat(rec.breakdown.performance.toFixed(2)),
          responseTime: parseFloat(rec.breakdown.responseTime.toFixed(2)),
        },
      },
      reasoning: rec.reasoning,
      recommendation: getRecommendationLevel(rec.totalScore),
    }));

    logger.info('Recomendaciones enviadas', {
      count: response.length,
      topScore: response[0]?.score.total,
    });

    return NextResponse.json({
      success: true,
      recommendations: response,
      metadata: {
        timestamp: new Date().toISOString(),
        criteria: { tipo, prioridad },
      },
    });
  } catch (error: any) {
    logError(error, 'Error obteniendo recomendaciones de proveedores');

    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener recomendaciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Determina el nivel de recomendación basado en el score
 */
function getRecommendationLevel(score: number): string {
  if (score >= 85) return 'Altamente Recomendado';
  if (score >= 70) return 'Recomendado';
  if (score >= 55) return 'Aceptable';
  if (score >= 40) return 'Considerar con Cautela';
  return 'No Recomendado';
}

/**
 * API: GET /api/agents/metrics
 * Obtiene métricas de uso y desempeño de los agentes IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAgentsMetrics } from '@/lib/ai-agents';
import { AgentType } from '@/lib/ai-agents/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos (solo admin puede ver métricas)
    const isAdmin = ['super_admin', 'admin', 'administrador'].includes(session.user.role || '');
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const agentType = searchParams.get('agentType') as AgentType | null;
    const periodDays = parseInt(searchParams.get('periodDays') || '30');

    // Obtener métricas
    const metrics = await getAgentsMetrics(agentType || undefined, periodDays);

    // Calcular resumen global
    const globalSummary = {
      totalInteractions: metrics.reduce((sum, m) => sum + m.totalInteractions, 0),
      avgResponseTime:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length
          : 0,
      avgConfidence:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.averageConfidence, 0) / metrics.length
          : 0,
      avgEscalationRate:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.escalationRate, 0) / metrics.length
          : 0,
      totalSuccessRate:
        (metrics.reduce((sum, m) => sum + m.successfulInteractions, 0) /
          Math.max(
            metrics.reduce((sum, m) => sum + m.totalInteractions, 0),
            1
          )) *
        100,
    };

    // Agente más usado
    const mostUsedAgent = metrics.reduce(
      (max, m) => (m.totalInteractions > max.totalInteractions ? m : max),
      metrics[0]
    );

    // Agente con mejor rendimiento
    const bestPerformingAgent = metrics.reduce(
      (best, m) => (m.averageConfidence > best.averageConfidence ? m : best),
      metrics[0]
    );

    return NextResponse.json({
      success: true,
      period: {
        days: periodDays,
        from: metrics[0]?.period.from,
        to: metrics[0]?.period.to,
      },
      globalSummary,
      insights: {
        mostUsedAgent: mostUsedAgent?.agentType,
        bestPerformingAgent: bestPerformingAgent?.agentType,
        needsAttention: metrics.filter((m) => m.escalationRate > 20).map((m) => m.agentType),
      },
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo métricas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

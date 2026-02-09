/**
 * API Endpoint: Métricas de IA
 * 
 * GET /api/v1/analytics/ai
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import analyticsService from '@/lib/analytics-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as any) || 'today';

    if (!['today', 'week', 'month', 'year'].includes(period)) {
      return NextResponse.json({ error: 'Periodo inválido' }, { status: 400 });
    }

    const metrics = await analyticsService.getAIMetrics(companyId, period);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error('Error getting AI metrics:', error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas de IA', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Endpoint: Métricas de Performance
 * 
 * GET /api/v1/analytics/performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPerformanceMetrics } from '@/lib/analytics-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden ver métricas de performance
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as any) || 'today';

    if (!['today', 'week', 'month'].includes(period)) {
      return NextResponse.json({ error: 'Periodo inválido' }, { status: 400 });
    }

    const metrics = await getPerformanceMetrics(period);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas de performance', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route: /api/ewoorker/analytics/trends
 *
 * GET: Obtener tendencias de métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerAnalytics } from '@/lib/ewoorker-analytics-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const VALID_METRICS = ['empresas', 'obras', 'ofertas', 'contratos', 'transacciones'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricParam = searchParams.get('metric') || 'empresas';
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    const metric = VALID_METRICS.includes(metricParam as any)
      ? (metricParam as 'empresas' | 'obras' | 'ofertas' | 'contratos' | 'transacciones')
      : 'empresas';

    const trend = await ewoorkerAnalytics.getTrend(metric, days);

    return NextResponse.json({
      success: true,
      metric,
      days,
      trend,
    });
  } catch (error: any) {
    logger.error('[API EwoorkerAnalytics Trends] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { analyzeRevenueTrends, benchmarkProperties, compareMultiPeriod } from '@/lib/bi-service';

export const dynamic = 'force-dynamic';

// GET /api/bi/stats - Obtener estadísticas y análisis
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const months = parseInt(searchParams.get('months') || '6');

    if (type === 'revenue_trends') {
      const trends = await analyzeRevenueTrends(session?.user?.companyId, months);
      return NextResponse.json(trends);
    }

    if (type === 'benchmark') {
      const benchmarks = await benchmarkProperties(session?.user?.companyId);
      return NextResponse.json(benchmarks);
    }

    if (type === 'compare') {
      const metric = searchParams.get('metric') || 'revenue';
      const comparison = await compareMultiPeriod(session?.user?.companyId, metric as any, months);
      return NextResponse.json(comparison);
    }

    // Overview por defecto
    const [revenueTrends, benchmarks] = await Promise.all([
      analyzeRevenueTrends(session?.user?.companyId, 6),
      benchmarkProperties(session?.user?.companyId),
    ]);

    return NextResponse.json({
      revenueTrends,
      benchmarks,
    });
  } catch (error) {
    logger.error('Error fetching BI stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

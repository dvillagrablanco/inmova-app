import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    const companyId = (session?.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ trends: [] });
    }
    const { getAnalyticsTrends } = (await import('@/lib/analytics-service')) as any;
    const result = await getAnalyticsTrends(companyId, months);

    // getAnalyticsTrends returns { companyId, trends, months } - extract the array
    const trendsArray = Array.isArray(result) ? result : (result?.trends || []);
    return NextResponse.json({ trends: trendsArray });
  } catch (error: any) {
    logger.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar tendencias' },
      { status: 500 }
    );
  }
}

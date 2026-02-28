import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/fiscal/alerts
 * Obtiene alertas fiscales pendientes para la empresa del usuario y sus filiales.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getFiscalAlerts } = await import('@/lib/fiscal-alerts-service');
    const alerts = await getFiscalAlerts(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    logger.error('[Fiscal Alerts API]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

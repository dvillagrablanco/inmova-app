/**
 * API Route: /api/ewoorker/analytics/platform
 *
 * GET: Obtener métricas de la plataforma (admin/socio)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerAnalytics } from '@/lib/ewoorker-analytics-service';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'administrador', 'socio_ewoorker'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const timeRange =
      startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : undefined;

    const metrics = await ewoorkerAnalytics.getPlatformMetrics(timeRange);

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('[API EwoorkerAnalytics Platform] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

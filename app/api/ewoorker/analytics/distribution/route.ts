/**
 * API Route: /api/ewoorker/analytics/distribution
 *
 * GET: Obtener distribución geográfica o por especialidad
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerAnalytics } from '@/lib/ewoorker-analytics-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'geographic';

    let distribution;

    if (type === 'specialty') {
      distribution = await ewoorkerAnalytics.getSpecialtyDistribution();
    } else {
      distribution = await ewoorkerAnalytics.getGeographicDistribution();
    }

    return NextResponse.json({
      success: true,
      type,
      distribution,
    });
  } catch (error: any) {
    console.error('[API EwoorkerAnalytics Distribution] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * API Route: /api/ewoorker/analytics/profile
 *
 * GET: Obtener métricas del perfil de empresa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ewoorkerAnalytics } from '@/lib/ewoorker-analytics-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: { include: { ewoorkerPerfil: true } } },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const timeRange =
      startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : undefined;

    const metrics = await ewoorkerAnalytics.getPerfilMetrics(
      user.company.ewoorkerPerfil.id,
      timeRange
    );

    if (!metrics) {
      return NextResponse.json({ error: 'Error obteniendo métricas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('[API EwoorkerAnalytics Profile] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

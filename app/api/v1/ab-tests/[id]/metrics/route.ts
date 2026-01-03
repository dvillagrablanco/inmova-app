/**
 * API Route: A/B Test Metrics
 * 
 * GET /api/v1/ab-tests/[id]/metrics
 * 
 * Obtiene métricas y resultados de un A/B test.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getABTestMetrics } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const testId = params.id;
    const metrics = await getABTestMetrics(testId);

    return NextResponse.json(metrics);

  } catch (error: any) {
    console.error('Error fetching A/B test metrics:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

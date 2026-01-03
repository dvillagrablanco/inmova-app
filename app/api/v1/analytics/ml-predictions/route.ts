/**
 * API Route: ML Predictions
 * 
 * GET /api/v1/analytics/ml-predictions?type=churn|revenue|occupancy|anomalies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  predictChurnBatch,
  forecastRevenue,
  forecastOccupancy,
  detectAnomalies,
} from '@/lib/ml-predictions-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Only ADMIN/SUPERADMIN
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const results: any = {};

    if (type === 'all' || type === 'churn') {
      results.churn = await predictChurnBatch(session.user.companyId);
    }

    if (type === 'all' || type === 'revenue') {
      results.revenue = await forecastRevenue(session.user.companyId, 3);
    }

    if (type === 'all' || type === 'occupancy') {
      results.occupancy = await forecastOccupancy(session.user.companyId);
    }

    if (type === 'all' || type === 'anomalies') {
      results.anomalies = await detectAnomalies(session.user.companyId);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in ML predictions:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

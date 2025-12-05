import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCashFlowForecasts,
  generateCashFlowForecast,
} from '@/lib/services/advanced-finance-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    const companyId = (session.user as any).companyId;
    const forecasts = await getCashFlowForecasts(companyId, buildingId);

    return NextResponse.json(forecasts);
  } catch (error: any) {
    console.error('Error en GET /api/finanzas/cashflow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const companyId = (session.user as any).companyId;

    const forecasts = await generateCashFlowForecast(
      companyId,
      body.buildingId,
      body.meses || 6
    );

    return NextResponse.json(forecasts, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/finanzas/cashflow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

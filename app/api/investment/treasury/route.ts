import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/treasury?saldoInicial=50000&companyId=xxx
 * Previsión de tesorería a 12 meses
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const saldoInicial = parseFloat(searchParams.get('saldoInicial') || '0');
    const companyId = searchParams.get('companyId') || session.user.companyId;

    const { generateTreasuryForecast } = await import('@/lib/treasury-forecast-service');
    const forecast = await generateTreasuryForecast(companyId, saldoInicial);

    return NextResponse.json({ success: true, data: forecast });
  } catch (error: any) {
    logger.error('[Treasury API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

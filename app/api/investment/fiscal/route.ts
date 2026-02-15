import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/fiscal?year=2025&companyId=xxx
 * Simulador fiscal para sociedades patrimoniales (IS al 25%).
 * Calcula base imponible, amortizaciones, intereses deducibles, cuota IS.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const companyId = searchParams.get('companyId') || session.user.companyId;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ano invalido' }, { status: 400 });
    }

    const { calculateFiscalSummary } = await import('@/lib/investment-service');
    const fiscal = await calculateFiscalSummary(companyId, year);

    return NextResponse.json({ success: true, data: fiscal });
  } catch (error: any) {
    logger.error('[Fiscal API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando fiscal' }, { status: 500 });
  }
}

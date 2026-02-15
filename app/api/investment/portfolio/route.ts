import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/portfolio
 * Resumen del portfolio de la empresa activa.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    const { getCompanyPortfolio } = await import('@/lib/investment-service');
    const portfolio = await getCompanyPortfolio(companyId);

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error: any) {
    logger.error('[Investment Portfolio API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo portfolio' }, { status: 500 });
  }
}

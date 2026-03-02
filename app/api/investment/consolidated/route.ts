import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/consolidated
 * Dashboard consolidado multi-sociedad para grupo inversor.
 * Agrega KPIs de la empresa del usuario + sus filiales.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 400 });
    }

    const prisma = getPrismaClient();

    // Consolidated: include child companies for group view
    const companyHierarchy = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { childCompanies: { select: { id: true } } },
    });
    const allCompanyIds = companyHierarchy
      ? [session.user.companyId, ...companyHierarchy.childCompanies.map((c: { id: string }) => c.id)]
      : [session.user.companyId];

    const { getConsolidatedReport } = await import('@/lib/investment-service');
    const report = await getConsolidatedReport(companyId);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    const errorStack = error?.stack?.slice(0, 500) || '';
    logger.error('[Investment Consolidated API]:', { message: errorMsg, stack: errorStack });
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Error generando reporte consolidado', detail: errorMsg },
      { status: 500 }
    );
  }
}

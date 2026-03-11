import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/monthly-snapshots
 *
 * Returns historical monthly snapshots for patrimonio evolution,
 * performance tracking, and asset allocation over time.
 *
 * Query params:
 *   portfolioCode - filter by portfolio (1149.01, 1149.03, 1142.09, or "all")
 *   from - start date (YYYY-MM-DD)
 *   to - end date (YYYY-MM-DD)
 *   latest - if "true", returns only the most recent snapshot per portfolio
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = session.user.companyId;
    const portfolioCode = searchParams.get('portfolioCode') || 'all';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const latest = searchParams.get('latest') === 'true';

    const prisma = await getPrisma();

    const where: any = { companyId };

    if (portfolioCode !== 'all') {
      where.portfolioCode = portfolioCode;
    }

    if (from || to) {
      where.reportDate = {};
      if (from) where.reportDate.gte = new Date(from);
      if (to) where.reportDate.lte = new Date(to);
    }

    if (latest) {
      const portfolios = await prisma.monthlySnapshot.findMany({
        where,
        distinct: ['portfolioCode'],
        orderBy: { reportDate: 'desc' },
        take: 10,
      });

      return NextResponse.json({ success: true, data: portfolios });
    }

    const snapshots = await prisma.monthlySnapshot.findMany({
      where,
      orderBy: { reportDate: 'asc' },
    });

    // Compute aggregated evolution if "all" portfolios
    let evolution: Array<{
      date: string;
      totalValue: number;
      af: number;
      pe: number;
      ar: number;
      amper: number;
    }> = [];

    if (portfolioCode === 'all') {
      const byDate: Record<string, any> = {};
      for (const s of snapshots) {
        const dateKey = s.reportDate.toISOString().slice(0, 10);
        if (!byDate[dateKey]) {
          byDate[dateKey] = { date: dateKey, totalValue: 0, af: 0, pe: 0, ar: 0, amper: 0 };
        }
        byDate[dateKey].totalValue += s.totalValue;
        if (s.portfolioCode === '1149.01') byDate[dateKey].af = s.totalValue;
        if (s.portfolioCode === '1149.02') byDate[dateKey].pe = s.totalValue;
        if (s.portfolioCode === '1149.03') byDate[dateKey].ar = s.totalValue;
        if (s.portfolioCode === '1142.09') byDate[dateKey].amper = s.totalValue;
      }
      evolution = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }

    // Latest performance data
    const latestAF = snapshots
      .filter(s => s.portfolioCode === '1149.01')
      .sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime())[0];

    const performance = latestAF ? {
      ytd: latestAF.returnYtd,
      return2023: latestAF.return2023,
      return2024: latestAF.return2024,
      return2025: latestAF.return2025,
      sinceInception: latestAF.returnSinceInception,
      annualized: latestAF.annualizedReturn,
      volatility: latestAF.volatility12m,
      sharpe: latestAF.sharpeRatio,
    } : null;

    // Asset allocation with targets (from latest snapshot)
    const allocationWithTargets = latestAF ? {
      monetario: { value: latestAF.monetario, weight: 0, target: latestAF.targetMonetario },
      rentaFija: { value: latestAF.rentaFija, weight: 0, target: latestAF.targetRentaFija },
      rentaVariable: { value: latestAF.rentaVariable, weight: 0, target: latestAF.targetRentaVariable },
      commodities: { value: latestAF.commodities, weight: 0, target: null },
      alternativos: { value: latestAF.alternativos, weight: 0, target: null },
    } : null;

    if (allocationWithTargets && latestAF) {
      const total = latestAF.totalValue || 1;
      for (const [key, val] of Object.entries(allocationWithTargets)) {
        (val as any).weight = Math.round(((val as any).value / total) * 10000) / 100;
      }
    }

    // Custodian breakdown (from latest AF snapshot)
    const custodianBreakdown = latestAF?.custodianBreakdown || null;

    // Fee history
    const feeHistory = snapshots
      .filter(s => s.portfolioCode === '1149.01' && s.fees !== 0)
      .map(s => ({
        date: s.reportDate.toISOString().slice(0, 10),
        fees: s.fees,
        breakdown: s.feeBreakdown,
      }));

    return NextResponse.json({
      success: true,
      data: {
        snapshots,
        evolution,
        performance,
        allocationWithTargets,
        custodianBreakdown,
        feeHistory,
        totalSnapshots: snapshots.length,
      },
    });
  } catch (error: any) {
    logger.error('[Monthly Snapshots API]:', error);
    return NextResponse.json({ error: 'Error obteniendo snapshots' }, { status: 500 });
  }
}

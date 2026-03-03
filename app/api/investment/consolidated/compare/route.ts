import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investment/consolidated/compare?year=2025
 * Comparativa de rentabilidad post-impuestos entre sociedades del grupo.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Obtener empresa + filiales
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: { childCompanies: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const allCompanies = [company, ...company.childCompanies];

    const { getCompanyPortfolio, calculateFiscalSummary } = await import('@/lib/investment-service');

    const comparisons = await Promise.all(
      allCompanies.map(async (co) => {
        const isHoldingCompany = co.id === company.id && company.childCompanies.length > 0;
        // Holdings: show consolidated, subsidiaries: show own data
        const portfolio = await getCompanyPortfolio(co.id, isHoldingCompany);
        const fiscal = await calculateFiscalSummary(co.id, year);

        const annualIncome = portfolio.totalMonthlyIncome * 12;
        const annualExpenses = portfolio.totalMonthlyExpenses * 12;
        const annualMortgage = portfolio.totalMortgagePayments * 12;
        const noi = annualIncome - annualExpenses; // Net Operating Income
        const cashFlowPreTax = noi - annualMortgage;
        const cashFlowPostTax = cashFlowPreTax - fiscal.cuotaIS;

        // ROE = Cash-flow post-impuestos / Equity
        const equity = portfolio.totalMarketValue - portfolio.totalMortgageDebt;
        const roe = equity > 0 ? Math.round((cashFlowPostTax / equity) * 10000) / 100 : 0;

        // Rentabilidad post-impuestos sobre inversión
        const rentabilidadPostImpuestos = portfolio.totalInvestment > 0
          ? Math.round((cashFlowPostTax / portfolio.totalInvestment) * 10000) / 100
          : 0;

        return {
          companyId: co.id,
          companyName: isHoldingCompany ? `${co.nombre} (Consolidado)` : co.nombre,
          cif: co.cif || '',
          isHolding: isHoldingCompany,
          // Portfolio
          totalAssets: portfolio.totalAssets,
          totalInvestment: Math.round(portfolio.totalInvestment),
          totalMarketValue: Math.round(portfolio.totalMarketValue),
          totalDebt: Math.round(portfolio.totalMortgageDebt),
          equity: Math.round(equity),
          ltv: portfolio.ltv,
          // Rentabilidad
          grossYield: portfolio.grossYield,
          netYield: portfolio.netYield,
          // Fiscal
          ingresosBrutos: fiscal.ingresosBrutos,
          gastosDeducibles: fiscal.gastosDeducibles + fiscal.amortizaciones + fiscal.interesesHipoteca,
          baseImponible: fiscal.baseImponible,
          cuotaIS: fiscal.cuotaIS,
          tipoEfectivo: fiscal.tipoEfectivo,
          // Cash-flow
          cashFlowPreTax: Math.round(cashFlowPreTax),
          cashFlowPostTax: Math.round(cashFlowPostTax),
          // Ratios
          roe,
          rentabilidadPostImpuestos,
          cashOnCash: portfolio.totalInvestment > 0
            ? Math.round((cashFlowPostTax / (portfolio.totalInvestment - portfolio.totalMortgageDebt)) * 10000) / 100
            : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        year,
        companies: comparisons,
        best: {
          highestYield: comparisons.reduce((best, c) => c.netYield > best.netYield ? c : best, comparisons[0])?.companyName,
          highestCashFlow: comparisons.reduce((best, c) => c.cashFlowPostTax > best.cashFlowPostTax ? c : best, comparisons[0])?.companyName,
          lowestTax: comparisons.reduce((best, c) => c.tipoEfectivo < best.tipoEfectivo ? c : best, comparisons[0])?.companyName,
          highestROE: comparisons.reduce((best, c) => c.roe > best.roe ? c : best, comparisons[0])?.companyName,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Consolidated Compare API]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

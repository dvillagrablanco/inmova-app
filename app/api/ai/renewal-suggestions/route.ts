import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/ai/renewal-suggestions
 * Analiza contratos próximos a vencer y sugiere:
 * - Incremento de renta recomendado (IPC + mercado)
 * - Contratos que conviene no renovar
 * - Oportunidades de mejora en renovación
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyId = scope.activeCompanyId;
    const now = new Date();
    const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    // Contratos que vencen en los próximos 6 meses
    const expiringContracts = await prisma.contract.findMany({
      where: {
        unit: { building: { companyId } },
        estado: 'activo',
        fechaFin: { gte: now, lte: sixMonthsLater },
      },
      include: {
        tenant: { select: { id: true, nombreCompleto: true, scoring: true } },
        unit: {
          select: {
            id: true, numero: true, tipo: true, superficie: true, rentaMensual: true,
            building: { select: { nombre: true } },
          },
        },
        payments: {
          where: { estado: 'atrasado' },
          select: { id: true },
        },
      },
      orderBy: { fechaFin: 'asc' },
    });

    // Get IPC reference (latest known)
    const IPC_ANUAL = 3.2; // IPC interanual España (referencia 2026)
    const IPC_REFERENCE_DATE = '2026-02';

    // Get market data for rent comparison
    let marketDataModule: any = null;
    try {
      marketDataModule = await import('@/lib/market-data-service');
    } catch {}

    const recommendations = expiringContracts.map(contract => {
      const monthsToExpiry = Math.ceil((contract.fechaFin.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const currentRent = contract.rentaMensual;
      const latePayments = contract.payments.length;
      const tenantScoring = contract.tenant?.scoring || 50;

      // Calculate suggested rent
      const ipcIncrement = currentRent * (IPC_ANUAL / 100);
      const suggestedRentIPC = Math.round((currentRent + ipcIncrement) * 100) / 100;

      // Market rent estimate
      let marketRent: number | null = null;
      let marketGap = 0;
      if (marketDataModule && contract.unit?.building) {
        const mkt = marketDataModule.getMarketDataByAddress(contract.unit.building.nombre || '');
        if (mkt && contract.unit.superficie) {
          const rentPerM2 = mkt.precioRealAlquilerM2 || mkt.askingPriceAlquilerM2 * 0.88;
          marketRent = Math.round(rentPerM2 * contract.unit.superficie);
          marketGap = marketRent > 0 ? ((marketRent - currentRent) / currentRent) * 100 : 0;
        }
      }

      // Risk assessment
      let riskLevel: 'bajo' | 'medio' | 'alto' = 'bajo';
      let recommendation: 'renovar_con_incremento' | 'renovar_manteniendo' | 'evaluar_no_renovar' | 'no_renovar';
      let reason: string;

      if (latePayments >= 3 || tenantScoring < 30) {
        riskLevel = 'alto';
        recommendation = 'no_renovar';
        reason = `${latePayments} pagos atrasados, scoring ${tenantScoring}/100. Alto riesgo de morosidad.`;
      } else if (latePayments >= 1 || tenantScoring < 50) {
        riskLevel = 'medio';
        recommendation = 'evaluar_no_renovar';
        reason = `${latePayments} pagos atrasados, scoring ${tenantScoring}/100. Evaluar condiciones.`;
      } else if (marketGap > 15) {
        riskLevel = 'bajo';
        recommendation = 'renovar_con_incremento';
        reason = `Renta ${marketGap.toFixed(0)}% por debajo de mercado. Incrementar progresivamente.`;
      } else {
        riskLevel = 'bajo';
        recommendation = 'renovar_con_incremento';
        reason = `Buen inquilino (scoring ${tenantScoring}). Aplicar IPC (${IPC_ANUAL}%).`;
      }

      const suggestedRent = marketRent && marketGap > 10
        ? Math.round(currentRent + Math.min(ipcIncrement * 2, (marketRent - currentRent) * 0.5))
        : suggestedRentIPC;

      return {
        contractId: contract.id,
        tenant: contract.tenant?.nombreCompleto || 'N/A',
        tenantScoring,
        building: contract.unit?.building?.nombre || '',
        unit: contract.unit?.numero || '',
        unitType: contract.unit?.tipo || 'vivienda',
        currentRent,
        suggestedRent,
        suggestedRentIPC,
        marketRent,
        marketGap: Number(marketGap.toFixed(1)),
        monthsToExpiry,
        expiryDate: contract.fechaFin.toISOString().split('T')[0],
        latePayments,
        riskLevel,
        recommendation,
        reason,
        incrementPercent: Number((((suggestedRent - currentRent) / currentRent) * 100).toFixed(1)),
      };
    });

    // Sort: high risk first, then by expiry
    recommendations.sort((a, b) => {
      const riskOrder = { alto: 0, medio: 1, bajo: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return a.monthsToExpiry - b.monthsToExpiry;
    });

    return NextResponse.json({
      success: true,
      recommendations,
      stats: {
        total: recommendations.length,
        highRisk: recommendations.filter(r => r.riskLevel === 'alto').length,
        mediumRisk: recommendations.filter(r => r.riskLevel === 'medio').length,
        lowRisk: recommendations.filter(r => r.riskLevel === 'bajo').length,
        avgIncrement: recommendations.length > 0
          ? Number((recommendations.reduce((s, r) => s + r.incrementPercent, 0) / recommendations.length).toFixed(1))
          : 0,
      },
      ipcReference: { rate: IPC_ANUAL, date: IPC_REFERENCE_DATE },
    });
  } catch (error: any) {
    logger.error('[AI Renewal Suggestions]:', error);
    return NextResponse.json({ error: 'Error generando sugerencias' }, { status: 500 });
  }
}

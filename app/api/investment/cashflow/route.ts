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
 * GET /api/investment/cashflow
 * Estado de Flujos de Efectivo — 3 periodos (YTD, TAM, Año Natural)
 * Estructura: Flujo Operativo → Flujo Inversión → Flujo Financiación → Variación Neta
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const { buildPaymentScopeFilter, buildExpenseScopeFilter } = await import(
      '@/lib/unit-scope'
    );
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });
    const companyIds = scope.scopeCompanyIds;
    const paymentScope = buildPaymentScopeFilter(companyIds);
    const expenseScope = buildExpenseScopeFilter(companyIds);
    const now = new Date();
    const currentYear = now.getFullYear();

    const periods = [
      { key: 'ytd', label: 'YTD ' + currentYear, from: new Date(currentYear, 0, 1), to: now, months: now.getMonth() + 1 },
      { key: 'tam', label: 'TAM (12M)', from: new Date(now.getTime() - 365 * 86400000), to: now, months: 12 },
      { key: 'anual', label: 'Año ' + (currentYear - 1), from: new Date(currentYear - 1, 0, 1), to: new Date(currentYear - 1, 11, 31, 23, 59, 59), months: 12 },
    ];

    const results: Record<string, any> = {};

    for (const period of periods) {
      // ── FLUJO OPERATIVO ──
      // Cobros: pagos recibidos (estado pagado, con fechaPago en periodo)
      const cobros = await prisma.payment.aggregate({
        where: {
          ...paymentScope,
          estado: 'pagado',
          fechaPago: { gte: period.from, lte: period.to },
        },
        _sum: { monto: true },
        _count: true,
      });

      // Pagos operativos: gastos del periodo (sociedad propietaria o gestora)
      const gastosOp = await prisma.expense.aggregate({
        where: {
          ...expenseScope,
          fecha: { gte: period.from, lte: period.to },
        },
        _sum: { monto: true },
        _count: true,
      });

      const cobrosVal = cobros._sum.monto || 0;
      const gastosVal = gastosOp._sum.monto || 0;
      const flujoOperativo = cobrosVal - gastosVal;

      // ── FLUJO DE INVERSIÓN ──
      // Compras de activos en el periodo
      const comprasActivos = await prisma.assetAcquisition.aggregate({
        where: {
          companyId: { in: companyIds },
          fechaAdquisicion: { gte: period.from, lte: period.to },
        },
        _sum: { inversionTotal: true },
        _count: true,
      });
      const inversionCapex = comprasActivos._sum.inversionTotal || 0;

      const flujoInversion = -inversionCapex;

      // ── FLUJO DE FINANCIACIÓN ──
      // Cuotas hipotecarias del periodo
      const mortgages = await prisma.mortgage.findMany({
        where: { companyId: { in: companyIds }, estado: 'activa' },
        select: { cuotaMensual: true },
      });
      const hipotecasMensual = mortgages.reduce((s, m) => s + m.cuotaMensual, 0);
      const hipotecasPeriodo = hipotecasMensual * period.months;

      const flujoFinanciacion = -hipotecasPeriodo;

      // ── VARIACIÓN NETA ──
      const variacionNeta = flujoOperativo + flujoInversion + flujoFinanciacion;

      results[period.key] = {
        label: period.label,
        months: period.months,
        operativo: {
          cobrosAlquiler: Math.round(cobrosVal * 100) / 100,
          cobrosCount: cobros._count,
          gastosOperativos: Math.round(gastosVal * 100) / 100,
          gastosCount: gastosOp._count,
          flujoOperativo: Math.round(flujoOperativo * 100) / 100,
        },
        inversion: {
          comprasActivos: Math.round(inversionCapex * 100) / 100,
          comprasCount: comprasActivos._count,
          flujoInversion: Math.round(flujoInversion * 100) / 100,
        },
        financiacion: {
          cuotasHipotecas: Math.round(hipotecasPeriodo * 100) / 100,
          flujoFinanciacion: Math.round(flujoFinanciacion * 100) / 100,
        },
        variacionNeta: Math.round(variacionNeta * 100) / 100,
        flujoOperativoMensual: Math.round((flujoOperativo / period.months) * 100) / 100,
      };
    }

    return NextResponse.json({ success: true, periods: results });
  } catch (error: any) {
    logger.error('[Investment Cashflow]:', error);
    return NextResponse.json({ error: 'Error generando cash-flow' }, { status: 500 });
  }
}

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
 * GET /api/investment/pyl
 * P&L consolidado por 3 periodos: YTD, TAM (12M), Año Natural
 * Usa datos reales de pagos y gastos, no estimaciones.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolve scope
    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });
    const companyIds = scope.scopeCompanyIds;

    const now = new Date();
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;

    // Define periods
    const ytdStart = new Date(currentYear, 0, 1); // Jan 1 current year
    const tamStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 12 months ago
    const anualStart = new Date(prevYear, 0, 1); // Jan 1 prev year
    const anualEnd = new Date(prevYear, 11, 31, 23, 59, 59); // Dec 31 prev year

    const monthsYTD = now.getMonth() + 1; // Jan=1, current month
    const monthsTAM = 12;
    const monthsAnual = 12;

    // Calculate P&L for each period
    async function calcPeriod(from: Date, to: Date, months: number, label: string, desc: string) {
      // Ingresos: pagos cobrados en el periodo
      const ingresos = await prisma.payment.aggregate({
        where: {
          estado: 'pagado',
          fechaPago: { gte: from, lte: to },
          contract: { unit: { building: { companyId: { in: companyIds } } } },
        },
        _sum: { monto: true },
      });

      // Gastos operativos en el periodo
      const gastos = await prisma.expense.aggregate({
        where: {
          fecha: { gte: from, lte: to },
          building: { companyId: { in: companyIds } },
        },
        _sum: { monto: true },
      });

      // Renta contratada mensual (para estimar amortización e impuestos)
      const contracts = await prisma.contract.findMany({
        where: {
          estado: 'activo',
          unit: { building: { companyId: { in: companyIds } } },
        },
        select: { rentaMensual: true },
      });
      const rentaMensualContratada = contracts.reduce((s, c) => s + c.rentaMensual, 0);

      // Hipotecas activas (cuota mensual × meses del periodo)
      const mortgages = await prisma.mortgage.findMany({
        where: { companyId: { in: companyIds }, estado: 'activa' },
        select: { cuotaMensual: true },
      });
      const hipotecasMensual = mortgages.reduce((s, m) => s + m.cuotaMensual, 0);

      // Amortización: 3% anual del valor construcción (estimado ~70% del precioCompra)
      const unitAgg = await prisma.unit.aggregate({
        where: { building: { companyId: { in: companyIds }, isDemo: false } },
        _sum: { precioCompra: true },
      });
      const precioCompraTotal = unitAgg._sum.precioCompra || 0;
      const amortAnual = precioCompraTotal * 0.70 * 0.03; // 3% de la parte construcción (70%)

      const ingresosVal = ingresos._sum.monto || 0;
      const gastosVal = gastos._sum.monto || 0;
      const noi = ingresosVal - gastosVal;
      const amortPeriodo = amortAnual * (months / 12);
      const hipotecasPeriodo = hipotecasMensual * months;

      // IS estimado: 25% sobre base imponible positiva
      const baseImponible = Math.max(0, noi - amortPeriodo - (hipotecasMensual > 0 ? hipotecasPeriodo * 0.3 : 0)); // ~30% de hipoteca son intereses
      const impuestos = baseImponible * 0.25;

      const beneficioNeto = noi - hipotecasPeriodo - impuestos;
      const cashFlow = ingresosVal - gastosVal - hipotecasPeriodo;

      return {
        label,
        description: desc,
        months,
        ingresos: Math.round(ingresosVal * 100) / 100,
        gastos: Math.round(gastosVal * 100) / 100,
        noi: Math.round(noi * 100) / 100,
        amortizaciones: Math.round(amortPeriodo * 100) / 100,
        hipotecas: Math.round(hipotecasPeriodo * 100) / 100,
        impuestos: Math.round(impuestos * 100) / 100,
        beneficioNeto: Math.round(beneficioNeto * 100) / 100,
        cashFlow: Math.round(cashFlow * 100) / 100,
      };
    }

    const [ytd, tam, anual] = await Promise.all([
      calcPeriod(ytdStart, now, monthsYTD, 'YTD', `Ene-${now.toLocaleDateString('es-ES', { month: 'short' })} ${currentYear}`),
      calcPeriod(tamStart, now, monthsTAM, 'TAM', `${tamStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })} - ${now.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}`),
      calcPeriod(anualStart, anualEnd, monthsAnual, 'Año Natural', `Ene-Dic ${prevYear}`),
    ]);

    return NextResponse.json({
      success: true,
      periods: { ytd, tam, anual },
    });
  } catch (error: any) {
    logger.error('[Investment P&L]:', error);
    return NextResponse.json({ error: 'Error generando P&L' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAccountLiquidBalance, resolveFamilyOfficeScope } from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/treasury-forecast
 * Previsión de tesorería a 6 meses:
 * Cobros (rentas) + dividendos - gastos - hipotecas - cuotas IS
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const today = new Date();
    const scope = await resolveFamilyOfficeScope(request, {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });
    const groupIds = scope.groupCompanyIds;

    // Saldo actual en cuentas (TODO el grupo)
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: groupIds }, activa: true },
      select: {
        saldoActual: true,
        entidad: true,
        alias: true,
        positions: {
          select: { valorActual: true },
        },
      },
    });
    const saldoActual = accounts.reduce(
      (sum, account) => sum + getAccountLiquidBalance(account),
      0
    );

    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId: { in: groupIds } } }, estado: 'activo' },
      select: { rentaMensual: true },
    });
    const rentaMensual = contracts.reduce((s, c) => s + c.rentaMensual, 0);

    // Gastos mensuales estimados (últimos 6 meses → media mensual)
    const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
    const recentExpenses = await prisma.expense.findMany({
      where: {
        building: { companyId: { in: groupIds }, isDemo: false },
        fecha: { gte: sixMonthsAgo },
      },
      select: { monto: true },
    });
    const gastosMensualesEstimados =
      recentExpenses.length > 0 ? recentExpenses.reduce((s, e) => s + e.monto, 0) / 6 : 0;

    // Hipotecas mensuales
    let hipotecaMensual = 0;
    const mortgages = await prisma.mortgage.findMany({
      where: { companyId: { in: groupIds }, estado: 'activa' },
      select: { cuotaMensual: true },
    });
    hipotecaMensual = mortgages.reduce((sum, mortgage) => sum + (mortgage.cuotaMensual || 0), 0);

    // Proyectar 6 meses
    let saldoProyectado = saldoActual;
    const forecast = [];

    for (let i = 0; i < 6; i++) {
      const month = addMonths(today, i);
      const cobros = rentaMensual;
      const pagos = gastosMensualesEstimados + hipotecaMensual;
      const neto = cobros - pagos;
      saldoProyectado += neto;

      // Trimestral: pago IS estimado
      const monthNum = month.getMonth() + 1;
      let pagoIS = 0;
      if ([4, 7, 10, 1].includes(monthNum)) {
        pagoIS = rentaMensual * 3 * 0.25 * 0.4; // ~40% margen * 25% IS
        saldoProyectado -= pagoIS;
      }

      forecast.push({
        mes: format(month, 'MMM yyyy', { locale: es }),
        mesNum: format(month, 'yyyy-MM'),
        cobros: Math.round(cobros),
        gastos: Math.round(gastosMensualesEstimados),
        hipotecas: Math.round(hipotecaMensual),
        pagoIS: Math.round(pagoIS),
        neto: Math.round(neto - pagoIS),
        saldoProyectado: Math.round(saldoProyectado),
      });
    }

    // Alertas
    const alertas: string[] = [];
    const saldoMinimo = Math.min(...forecast.map((f) => f.saldoProyectado));
    if (saldoMinimo < 50000) {
      alertas.push(
        `⚠️ Saldo cae por debajo de €50K en ${forecast.find((f) => f.saldoProyectado === saldoMinimo)?.mes}`
      );
    }
    if (saldoMinimo < 0) {
      alertas.push(`🔴 DÉFICIT de tesorería previsto. Necesitas financiación o reducir gastos.`);
    }

    // Desglose por entidad bancaria
    const porEntidad: Record<string, number> = {};
    for (const acc of accounts) {
      const key = acc.entidad || 'Sin entidad';
      porEntidad[key] = (porEntidad[key] || 0) + getAccountLiquidBalance(acc);
    }
    const desglose = Object.entries(porEntidad)
      .filter(([_, saldo]) => saldo > 0)
      .map(([entidad, saldo]) => ({ entidad, saldo: Math.round(saldo) }))
      .sort((a, b) => b.saldo - a.saldo);

    return NextResponse.json({
      success: true,
      saldoActual: Math.round(saldoActual),
      totalCuentas: accounts.length,
      sociedades: groupIds.length,
      porEntidad: desglose,
      flujosMensuales: {
        cobros: Math.round(rentaMensual),
        gastos: Math.round(gastosMensualesEstimados),
        hipotecas: Math.round(hipotecaMensual),
        netoMensual: Math.round(rentaMensual - gastosMensualesEstimados - hipotecaMensual),
      },
      forecast,
      alertas,
    });
  } catch (error: any) {
    logger.error('[Treasury Forecast]:', error);
    return NextResponse.json({ error: 'Error en previsión de tesorería' }, { status: 500 });
  }
}

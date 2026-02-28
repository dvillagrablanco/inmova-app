import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

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

    const companyId = session.user.companyId;

    // Saldo actual en cuentas
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId, activa: true },
      select: { saldoActual: true, entidad: true },
    });
    const saldoActual = accounts.reduce((s, a) => s + a.saldoActual, 0);

    // Renta mensual estimada (contratos activos del grupo)
    const groupIds = [companyId];
    const children = await prisma.company.findMany({
      where: { parentCompanyId: companyId },
      select: { id: true },
    });
    children.forEach((c) => groupIds.push(c.id));

    const contracts = await prisma.contract.findMany({
      where: { unit: { building: { companyId: { in: groupIds } } }, estado: 'activo' },
      select: { rentaMensual: true },
    });
    const rentaMensual = contracts.reduce((s, c) => s + c.rentaMensual, 0);

    // Gastos mensuales estimados
    const expenses = await prisma.expense.findMany({
      where: { building: { companyId: { in: groupIds } }, isDemo: false },
      select: { monto: true },
    });
    const gastosMensualesEstimados = expenses.length > 0
      ? expenses.reduce((s, e) => s + e.monto, 0) / 12 : 0;

    // Hipotecas mensuales
    let hipotecaMensual = 0;
    try {
      const mortgages = await (prisma as any).assetMortgage.findMany({
        where: { asset: { companyId: { in: groupIds } }, estado: 'activa' },
        select: { cuotaMensual: true },
      });
      hipotecaMensual = mortgages.reduce((s: number, m: any) => s + (m.cuotaMensual || 0), 0);
    } catch { /* model may not exist */ }

    // Proyectar 6 meses
    const today = new Date();
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
      alertas.push(`⚠️ Saldo cae por debajo de €50K en ${forecast.find((f) => f.saldoProyectado === saldoMinimo)?.mes}`);
    }
    if (saldoMinimo < 0) {
      alertas.push(`🔴 DÉFICIT de tesorería previsto. Necesitas financiación o reducir gastos.`);
    }

    return NextResponse.json({
      success: true,
      saldoActual: Math.round(saldoActual),
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

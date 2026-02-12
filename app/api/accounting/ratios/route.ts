import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { endOfMonth, startOfMonth } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const [year, month] = (periodo || '').split('-').map(Number);
    const baseDate = year && month ? new Date(year, month - 1, 1) : new Date();
    const fechaInicio = startOfMonth(baseDate);
    const fechaFin = endOfMonth(baseDate);

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: scope.companyIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: { tipo: true, categoria: true, monto: true },
    });

    let ingresos = 0, gastos = 0;
    let gastosMantenimiento = 0, gastosAdministracion = 0, gastosServicios = 0;
    let ingresoRenta = 0;

    for (const t of transactions) {
      if (t.tipo === 'ingreso') {
        ingresos += t.monto;
        if (t.categoria === 'ingreso_renta') ingresoRenta += t.monto;
      } else {
        gastos += t.monto;
        if (t.categoria === 'gasto_mantenimiento') gastosMantenimiento += t.monto;
        if (t.categoria === 'gasto_administracion') gastosAdministracion += t.monto;
        if (t.categoria === 'gasto_servicio') gastosServicios += t.monto;
      }
    }

    const beneficio = ingresos - gastos;
    const margenNeto = ingresos > 0 ? (beneficio / ingresos) * 100 : 0;
    const ratioGastos = ingresos > 0 ? (gastos / ingresos) * 100 : 0;
    const ratioMantenimiento = ingresos > 0 ? (gastosMantenimiento / ingresos) * 100 : 0;
    const ratioAdministracion = ingresos > 0 ? (gastosAdministracion / ingresos) * 100 : 0;

    // Total de unidades del scope para calcular rendimiento por unidad
    const totalUnits = await prisma.unit.count({
      where: { building: { companyId: { in: scope.companyIds } } },
    });

    const rendimientoPorUnidad = totalUnits > 0 ? beneficio / totalUnits : 0;

    return NextResponse.json({
      data: {
        periodo: periodo || `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
        isConsolidated: scope.isConsolidated,
        ratios: {
          margenNeto: Math.round(margenNeto * 100) / 100,
          ratioGastos: Math.round(ratioGastos * 100) / 100,
          ratioMantenimiento: Math.round(ratioMantenimiento * 100) / 100,
          ratioAdministracion: Math.round(ratioAdministracion * 100) / 100,
          rendimientoPorUnidad: Math.round(rendimientoPorUnidad * 100) / 100,
          totalUnidades: totalUnits,
        },
        kpis: {
          ingresos: Math.round(ingresos * 100) / 100,
          gastos: Math.round(gastos * 100) / 100,
          beneficioNeto: Math.round(beneficio * 100) / 100,
          ingresoRenta: Math.round(ingresoRenta * 100) / 100,
        },
      },
    });
  } catch (error) {
    logger.error('[Accounting Ratios] Error:', error);
    return NextResponse.json({ error: 'Error al obtener ratios financieros' }, { status: 500 });
  }
}

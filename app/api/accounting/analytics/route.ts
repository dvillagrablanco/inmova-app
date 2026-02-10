import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { endOfMonth, startOfMonth, subMonths, format } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Datos del periodo actual
    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: scope.companyIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: { tipo: true, categoria: true, monto: true, fecha: true, concepto: true },
    });

    // Datos del periodo anterior (para comparación)
    const prevStart = startOfMonth(subMonths(baseDate, 1));
    const prevEnd = endOfMonth(subMonths(baseDate, 1));
    const prevTransactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: scope.companyIds },
        fecha: { gte: prevStart, lte: prevEnd },
      },
      select: { tipo: true, monto: true },
    });

    // Calcular métricas
    let ingresos = 0, gastos = 0, prevIngresos = 0, prevGastos = 0;
    const categorias: Record<string, { ingresos: number; gastos: number }> = {};

    for (const t of transactions) {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else gastos += t.monto;

      if (!categorias[t.categoria]) categorias[t.categoria] = { ingresos: 0, gastos: 0 };
      if (t.tipo === 'ingreso') categorias[t.categoria].ingresos += t.monto;
      else categorias[t.categoria].gastos += t.monto;
    }

    for (const t of prevTransactions) {
      if (t.tipo === 'ingreso') prevIngresos += t.monto;
      else prevGastos += t.monto;
    }

    // Evolución mensual (últimos 6 meses)
    const evolucion = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(baseDate, i);
      const mStart = startOfMonth(mDate);
      const mEnd = endOfMonth(mDate);
      const mTxns = await prisma.accountingTransaction.findMany({
        where: {
          companyId: { in: scope.companyIds },
          fecha: { gte: mStart, lte: mEnd },
        },
        select: { tipo: true, monto: true },
      });

      let mIng = 0, mGas = 0;
      for (const t of mTxns) {
        if (t.tipo === 'ingreso') mIng += t.monto;
        else mGas += t.monto;
      }

      evolucion.push({
        mes: format(mDate, 'yyyy-MM'),
        label: format(mDate, 'MMM yy'),
        ingresos: Math.round(mIng * 100) / 100,
        gastos: Math.round(mGas * 100) / 100,
        neto: Math.round((mIng - mGas) * 100) / 100,
      });
    }

    const variacionIngresos = prevIngresos > 0 ? ((ingresos - prevIngresos) / prevIngresos) * 100 : 0;
    const variacionGastos = prevGastos > 0 ? ((gastos - prevGastos) / prevGastos) * 100 : 0;

    return NextResponse.json({
      data: {
        periodo: periodo || format(baseDate, 'yyyy-MM'),
        isConsolidated: scope.isConsolidated,
        resumen: {
          ingresos: Math.round(ingresos * 100) / 100,
          gastos: Math.round(gastos * 100) / 100,
          beneficioNeto: Math.round((ingresos - gastos) * 100) / 100,
          totalMovimientos: transactions.length,
          variacionIngresos: Math.round(variacionIngresos * 100) / 100,
          variacionGastos: Math.round(variacionGastos * 100) / 100,
        },
        categorias: Object.entries(categorias).map(([cat, vals]) => ({
          categoria: cat,
          ingresos: Math.round(vals.ingresos * 100) / 100,
          gastos: Math.round(vals.gastos * 100) / 100,
          neto: Math.round((vals.ingresos - vals.gastos) * 100) / 100,
        })),
        evolucion,
      },
    });
  } catch (error) {
    logger.error('[Accounting Analytics] Error:', error);
    return NextResponse.json({ error: 'Error al obtener analytics contables' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const [year, month] = (periodo || '').split('-').map(Number);
    const baseDate = year && month ? new Date(year, month - 1, 1) : new Date();
    const fechaInicio = startOfMonth(baseDate);
    const fechaFin = endOfMonth(baseDate);
    const periodoLabel =
      periodo || `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: {
        id: true,
        fecha: true,
        concepto: true,
        categoria: true,
        tipo: true,
        monto: true,
        referencia: true,
        buildingId: true,
        unitId: true,
      },
      orderBy: { fecha: 'desc' },
    });

    const ingresosCategorias = new Map<string, number>();
    const gastosCategorias = new Map<string, number>();
    const dailyMap = new Map<string, { ingresos: number; gastos: number }>();

    let ingresosTotal = 0;
    let gastosTotal = 0;

    for (const transaction of transactions) {
      const dayKey = format(transaction.fecha, 'yyyy-MM-dd');
      const daily = dailyMap.get(dayKey) || { ingresos: 0, gastos: 0 };

      if (transaction.tipo === 'ingreso') {
        ingresosTotal += transaction.monto;
        daily.ingresos += transaction.monto;
        ingresosCategorias.set(
          transaction.categoria,
          (ingresosCategorias.get(transaction.categoria) || 0) + transaction.monto
        );
      } else {
        gastosTotal += transaction.monto;
        daily.gastos += transaction.monto;
        gastosCategorias.set(
          transaction.categoria,
          (gastosCategorias.get(transaction.categoria) || 0) + transaction.monto
        );
      }

      dailyMap.set(dayKey, daily);
    }

    const labels = Array.from(dailyMap.keys()).sort();
    const serieDiaria = {
      labels,
      ingresos: labels.map((label) => dailyMap.get(label)?.ingresos || 0),
      gastos: labels.map((label) => dailyMap.get(label)?.gastos || 0),
    };

    const buildCategoryList = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      data: {
        periodo: periodoLabel,
        resumen: {
          ingresos: ingresosTotal,
          gastos: gastosTotal,
          flujoNeto: ingresosTotal - gastosTotal,
          totalMovimientos: transactions.length,
        },
        categorias: {
          ingresos: buildCategoryList(ingresosCategorias),
          gastos: buildCategoryList(gastosCategorias),
        },
        serieDiaria,
        movimientos: transactions.slice(0, 20).map((transaction) => ({
          id: transaction.id,
          fecha: transaction.fecha.toISOString(),
          concepto: transaction.concepto,
          categoria: transaction.categoria,
          tipo: transaction.tipo,
          monto: transaction.monto,
          referencia: transaction.referencia,
          buildingId: transaction.buildingId,
          unitId: transaction.unitId,
        })),
      },
    });
  } catch (error) {
    logger.error('[Accounting Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener analítica contable' },
      { status: 500 }
    );
  }
}

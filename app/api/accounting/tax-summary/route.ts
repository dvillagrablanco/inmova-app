import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { endOfMonth, startOfMonth } from 'date-fns';
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
        tipo: true,
        categoria: true,
        monto: true,
      },
    });

    let ingresos = 0;
    let gastos = 0;
    let impuestosPagados = 0;

    const detalleIngresos: Record<string, number> = {};
    const detalleGastos: Record<string, number> = {};

    for (const transaction of transactions) {
      if (transaction.tipo === 'ingreso') {
        ingresos += transaction.monto;
        detalleIngresos[transaction.categoria] =
          (detalleIngresos[transaction.categoria] || 0) + transaction.monto;
      } else {
        gastos += transaction.monto;
        detalleGastos[transaction.categoria] =
          (detalleGastos[transaction.categoria] || 0) + transaction.monto;
        if (transaction.categoria === 'gasto_impuesto') {
          impuestosPagados += transaction.monto;
        }
      }
    }

    return NextResponse.json({
      data: {
        periodo: periodoLabel,
        ingresos,
        gastos,
        resultadoAntesImpuestos: ingresos - gastos,
        gastosDeducibles: gastos,
        impuestosPagados,
        detalleIngresos,
        detalleGastos,
      },
    });
  } catch (error) {
    logger.error('[Accounting Tax Summary] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen fiscal' },
      { status: 500 }
    );
  }
}

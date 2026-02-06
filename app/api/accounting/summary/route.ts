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

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: {
        tipo: true,
        categoria: true,
        monto: true,
        fecha: true,
      },
    });

    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.tipo === 'ingreso') {
          acc.ingresos += transaction.monto;
        } else {
          acc.gastos += transaction.monto;
        }
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );

    return NextResponse.json({
      data: {
        periodo:
          periodo ||
          `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
        ingresos: summary.ingresos,
        gastos: summary.gastos,
        flujoNeto: summary.ingresos - summary.gastos,
        totalMovimientos: transactions.length,
      },
    });
  } catch (error) {
    logger.error('[Accounting Summary] Error:', error);
    return NextResponse.json({ error: 'Error al obtener resumen contable' }, { status: 500 });
  }
}

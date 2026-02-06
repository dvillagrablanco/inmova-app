import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { endOfMonth, startOfMonth, format } from 'date-fns';
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

    const latest = await prisma.accountingTransaction.findFirst({
      where: { companyId },
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    });

    if (!latest?.fecha) {
      return NextResponse.json({ data: null });
    }

    const fechaInicio = startOfMonth(latest.fecha);
    const fechaFin = endOfMonth(latest.fecha);

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: { tipo: true, monto: true },
    });

    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.tipo === 'ingreso') acc.ingresos += transaction.monto;
        else acc.gastos += transaction.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );

    return NextResponse.json({
      data: {
        periodo: format(fechaInicio, 'yyyy-MM'),
        ingresos: summary.ingresos,
        gastos: summary.gastos,
        flujoNeto: summary.ingresos - summary.gastos,
        totalMovimientos: transactions.length,
      },
    });
  } catch (error) {
    logger.error('[Accounting Latest Period] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener último período con datos' },
      { status: 500 }
    );
  }
}

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
      select: { tipo: true, categoria: true, monto: true, fecha: true },
    });

    const summary = transactions.reduce(
      (acc, t) => {
        if (t.tipo === 'ingreso') acc.ingresos += t.monto;
        else acc.gastos += t.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );

    return NextResponse.json({
      data: {
        periodo: periodo || `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
        ingresos: summary.ingresos,
        gastos: summary.gastos,
        flujoNeto: summary.ingresos - summary.gastos,
        totalMovimientos: transactions.length,
        isConsolidated: scope.isConsolidated,
      },
    });
  } catch (error) {
    logger.error('[Accounting Summary] Error:', error);
    return NextResponse.json({ error: 'Error al obtener resumen contable' }, { status: 500 });
  }
}

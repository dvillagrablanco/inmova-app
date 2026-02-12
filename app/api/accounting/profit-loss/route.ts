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
      select: {
        tipo: true,
        categoria: true,
        monto: true,
      },
    });

    const ingresosCategorias: Record<string, number> = {};
    const gastosCategorias: Record<string, number> = {};
    let ingresosTotal = 0;
    let gastosTotal = 0;

    for (const transaction of transactions) {
      if (transaction.tipo === 'ingreso') {
        ingresosTotal += transaction.monto;
        ingresosCategorias[transaction.categoria] =
          (ingresosCategorias[transaction.categoria] || 0) + transaction.monto;
      } else {
        gastosTotal += transaction.monto;
        gastosCategorias[transaction.categoria] =
          (gastosCategorias[transaction.categoria] || 0) + transaction.monto;
      }
    }

    const beneficioNeto = ingresosTotal - gastosTotal;
    const margenNeto = ingresosTotal > 0 ? beneficioNeto / ingresosTotal : 0;

    return NextResponse.json({
      data: {
        periodo: periodo || `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
        isConsolidated: scope.isConsolidated,
        ingresos: {
          total: ingresosTotal,
          categorias: ingresosCategorias,
        },
        gastos: {
          total: gastosTotal,
          categorias: gastosCategorias,
        },
        beneficioNeto,
        ebitda: beneficioNeto,
        margenes: {
          neto: margenNeto,
          operativo: margenNeto,
        },
      },
    });
  } catch (error) {
    logger.error('[Accounting Profit Loss] Error:', error);
    return NextResponse.json({ error: 'Error al obtener P&G' }, { status: 500 });
  }
}

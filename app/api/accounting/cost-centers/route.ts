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

    // Agrupar por edificio (buildingId) como centro de coste
    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: scope.companyIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      select: {
        tipo: true,
        categoria: true,
        monto: true,
        buildingId: true,
        companyId: true,
      },
    });

    // Agrupar por categoría como centros de coste
    const centers: Record<string, { nombre: string; ingresos: number; gastos: number; movimientos: number }> = {};

    for (const t of transactions) {
      const key = t.categoria;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!centers[key]) centers[key] = { nombre: label, ingresos: 0, gastos: 0, movimientos: 0 };
      if (t.tipo === 'ingreso') centers[key].ingresos += t.monto;
      else centers[key].gastos += t.monto;
      centers[key].movimientos++;
    }

    // También agrupar por empresa (para vista consolidada)
    const byCompany: Record<string, { ingresos: number; gastos: number }> = {};
    if (scope.isConsolidated) {
      for (const t of transactions) {
        if (!byCompany[t.companyId]) byCompany[t.companyId] = { ingresos: 0, gastos: 0 };
        if (t.tipo === 'ingreso') byCompany[t.companyId].ingresos += t.monto;
        else byCompany[t.companyId].gastos += t.monto;
      }
    }

    return NextResponse.json({
      data: Object.entries(centers)
        .map(([id, data]) => ({
          id,
          ...data,
          neto: Math.round((data.ingresos - data.gastos) * 100) / 100,
          ingresos: Math.round(data.ingresos * 100) / 100,
          gastos: Math.round(data.gastos * 100) / 100,
        }))
        .sort((a, b) => b.gastos - a.gastos),
      byCompany: scope.isConsolidated ? byCompany : undefined,
    });
  } catch (error) {
    logger.error('[Accounting Cost Centers] Error:', error);
    return NextResponse.json({ error: 'Error al obtener centros de coste' }, { status: 500 });
  }
}

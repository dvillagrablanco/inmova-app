import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { endOfMonth, startOfMonth } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CenterTotals = {
  id: string;
  ingresos: number;
  gastos: number;
  movimientos: number;
};

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
        buildingId: true,
        tipo: true,
        monto: true,
      },
    });

    const centersMap = new Map<string, CenterTotals>();

    for (const transaction of transactions) {
      const key = transaction.buildingId || 'sin-edificio';
      const current = centersMap.get(key) || {
        id: key,
        ingresos: 0,
        gastos: 0,
        movimientos: 0,
      };

      if (transaction.tipo === 'ingreso') {
        current.ingresos += transaction.monto;
      } else {
        current.gastos += transaction.monto;
      }

      current.movimientos += 1;
      centersMap.set(key, current);
    }

    const buildingIds = Array.from(centersMap.keys()).filter((id) => id !== 'sin-edificio');
    const buildings = buildingIds.length
      ? await prisma.building.findMany({
          where: { id: { in: buildingIds } },
          select: { id: true, nombre: true, direccion: true },
        })
      : [];
    const buildingMap = new Map(buildings.map((building) => [building.id, building]));

    const centers = Array.from(centersMap.values())
      .map((center) => {
        const building = buildingMap.get(center.id);
        const nombre =
          center.id === 'sin-edificio'
            ? 'Sin asignar'
            : building?.nombre || building?.direccion || 'Edificio sin nombre';

        return {
          id: center.id,
          nombre,
          ingresos: center.ingresos,
          gastos: center.gastos,
          flujoNeto: center.ingresos - center.gastos,
          movimientos: center.movimientos,
        };
      })
      .sort((a, b) => b.ingresos + b.gastos - (a.ingresos + a.gastos));

    return NextResponse.json({ data: centers });
  } catch (error) {
    logger.error('[Accounting Cost Centers] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener centros de coste' },
      { status: 500 }
    );
  }
}

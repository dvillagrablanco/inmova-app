export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

const startOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const addMonths = (date: Date, count: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = addMonths(monthStart, 1);
    const prevMonthStart = addMonths(monthStart, -1);

    const [
      totalProveedores,
      proveedoresActivos,
      totalServicios,
      serviciosActivos,
      reservasMes,
      reservasMesAnterior,
      ingresosMesAgg,
    ] = await Promise.all([
      prisma.provider.count({ where: { companyId } }),
      prisma.provider.count({ where: { companyId, activo: true } }),
      prisma.marketplaceService.count({ where: { companyId } }),
      prisma.marketplaceService.count({ where: { companyId, activo: true } }),
      prisma.marketplaceBooking.count({
        where: { companyId, fechaSolicitud: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.marketplaceBooking.count({
        where: { companyId, fechaSolicitud: { gte: prevMonthStart, lt: monthStart } },
      }),
      prisma.marketplaceBooking.aggregate({
        where: { companyId, estado: 'completada', fechaServicio: { gte: monthStart, lt: monthEnd } },
        _sum: { precioTotal: true, comision: true },
      }),
    ]);

    const ingresosTotales = ingresosMesAgg._sum.precioTotal || 0;
    const comisionesGeneradas = ingresosMesAgg._sum.comision || 0;
    const tasaConversion =
      reservasMesAnterior > 0
        ? Math.round(((reservasMes - reservasMesAnterior) / reservasMesAnterior) * 100)
        : reservasMes > 0
          ? 100
          : 0;

    return NextResponse.json({
      totalProveedores,
      proveedoresActivos,
      totalServicios,
      serviciosActivos,
      reservasEsteMes: reservasMes,
      ingresosTotales,
      comisionesGeneradas,
      tasaConversion,
    });
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

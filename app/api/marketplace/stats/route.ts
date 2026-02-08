export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Calcular estadísticas reales desde la base de datos
    const [
      totalServices,
      totalBookings,
      revenueAggregate,
      commissionAggregate,
    ] = await Promise.all([
      // Total de servicios activos
      prisma.marketplaceService.count({
        where: {
          companyId,
          activo: true,
        },
      }),
      // Total de reservas
      prisma.marketplaceBooking.count({
        where: {
          companyId,
        },
      }),
      // Reservas con ingresos para calcular revenue
      prisma.marketplaceBooking.aggregate({
        where: {
          companyId,
          estado: 'completada',
        },
        _sum: {
          precioTotal: true,
        },
      }),
      // Comisión promedio configurada en servicios
      prisma.marketplaceService.aggregate({
        where: {
          companyId,
          activo: true,
        },
        _avg: {
          comisionPorcentaje: true,
        },
      }),
    ]);

    // Calcular ingresos totales
    const totalRevenue = revenueAggregate._sum.precioTotal ?? 0;
    const commissionRate = commissionAggregate._avg.comisionPorcentaje ?? 0;

    const stats = {
      totalServices,
      totalBookings,
      totalRevenue,
      commissionRate,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    logger.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

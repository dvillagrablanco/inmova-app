export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const [totalServices, totalBookings, bookingsWithRevenue] = await Promise.all([
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
      prisma.marketplaceBooking.findMany({
        where: {
          companyId,
          estado: 'completada',
        },
        select: {
          precio: true,
        },
      }),
    ]);

    // Calcular ingresos totales
    const totalRevenue = bookingsWithRevenue.reduce(
      (sum, booking) => sum + (booking.precio || 0),
      0
    );

    const stats = {
      totalServices,
      totalBookings,
      totalRevenue,
      commissionRate: 12, // Porcentaje de comisión configurado
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

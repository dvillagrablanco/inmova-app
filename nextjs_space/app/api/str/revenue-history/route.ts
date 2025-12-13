import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    // Obtener datos de los últimos 12 meses
    const revenueData: Array<{
      month: string;
      revenue: number;
      bookings: number;
    }> = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const bookings = await prisma.sTRBooking.findMany({
        where: {
          listing: { companyId },
          checkInDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      const revenue = bookings.reduce((sum: number, b: any) => sum + (b.precioTotal || 0), 0);
      revenueData.push({
        month: format(monthDate, 'MMM', { locale: es }),
        revenue: Math.round(revenue),
        bookings: bookings.length,
      });
    }
    return NextResponse.json(revenueData);
  } catch (error) {
    logger.error('Error fetching revenue history:', error);
    return NextResponse.json({ error: 'Error al obtener historial de ingresos' }, { status: 500 });
  }
}

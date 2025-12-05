import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Obtener todos los anuncios STR
    const listings = await prisma.sTRListing.findMany({
      where: { companyId },
      include: {
        bookings: true,
        reviews: true,
      },
    });

    const totalListings = listings.length;
    const activeListings = listings.filter((l: any) => l.estado === 'activo').length;

    // Calcular reservas del mes actual
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    
    const currentMonthBookings = await prisma.sTRBooking.findMany({
      where: {
        listing: { companyId },
        checkInDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    // Calcular reservas del mes anterior
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
    
    const lastMonthBookings = await prisma.sTRBooking.findMany({
      where: {
        listing: { companyId },
        checkInDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    // Calcular ingresos
    const monthlyRevenue = currentMonthBookings.reduce((sum: number, b: any) => sum + (b.precioTotal || 0), 0);
    const lastMonthRevenue = lastMonthBookings.reduce((sum: number, b: any) => sum + (b.precioTotal || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Calcular reservas totales
    const allBookings = await prisma.sTRBooking.findMany({
      where: {
        listing: { companyId },
      },
    });

    const totalRevenue = allBookings.reduce((sum: number, b: any) => sum + (b.precioTotal || 0), 0);
    const totalBookings = allBookings.length;

    // Calcular ocupación (simplificado - asumimos que cada reserva es 1 día)
    const totalPossibleDays = listings.length * 30; // 30 días por propiedad
    const occupiedDays = currentMonthBookings.reduce((sum: number, b: any) => sum + (b.numNoches || 1), 0);
    const occupancyRate = totalPossibleDays > 0 
      ? Math.round((occupiedDays / totalPossibleDays) * 100)
      : 0;

    // Calcular tarifa promedio
    const avgNightlyRate = totalBookings > 0
      ? Math.round(totalRevenue / allBookings.reduce((sum: number, b: any) => sum + (b.numNoches || 1), 0))
      : 0;

    // Calcular valoración media
    const reviews = listings.flatMap((l: any) => l.reviews);
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + (r.puntuacion || 0), 0) / reviews.length) * 10) / 10
      : 0;

    // Determinar tendencia de ocupación
    const lastMonthOccupiedDays = lastMonthBookings.reduce((sum: number, b: any) => sum + (b.numNoches || 1), 0);
    const occupancyTrend = occupiedDays >= lastMonthOccupiedDays ? 'up' : 'down';

    const metrics = {
      totalListings,
      activeListings,
      occupancyRate,
      avgNightlyRate,
      totalRevenue,
      monthlyRevenue,
      totalBookings,
      avgRating,
      revenueGrowth,
      occupancyTrend,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching STR metrics:', error);
    return NextResponse.json({ error: 'Error al obtener métricas STR' }, { status: 500 });
  }
}

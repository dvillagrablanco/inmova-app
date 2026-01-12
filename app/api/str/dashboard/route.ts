import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'month', 'quarter', 'year'

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Total de anuncios
    const totalListings = await prisma.sTRListing.count({
      where: { companyId: session.user.companyId }
    });

    const activeListings = await prisma.sTRListing.count({
      where: { 
        companyId: session.user.companyId,
        activo: true 
      }
    });

    // Reservas
    const totalBookings = await prisma.sTRBooking.count({
      where: {
        listing: {
          companyId: session.user.companyId
        }
      }
    });

    const bookingsThisMonth = await prisma.sTRBooking.count({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        checkInDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    const confirmedBookings = await prisma.sTRBooking.count({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        estado: 'CONFIRMADA'
      }
    });

    const checkInTodayBookings = await prisma.sTRBooking.count({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        checkInDate: {
          gte: new Date(today.setHours(0,0,0,0)),
          lt: new Date(today.setHours(23,59,59,999))
        },
        estado: 'CONFIRMADA'
      }
    });

    const checkOutTodayBookings = await prisma.sTRBooking.count({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        checkOutDate: {
          gte: new Date(today.setHours(0,0,0,0)),
          lt: new Date(today.setHours(23,59,59,999))
        },
        estado: { in: ['CONFIRMADA', 'CHECK_IN'] }
      }
    });

    // Ingresos
    const allBookings = await prisma.sTRBooking.findMany({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        estado: { in: ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT'] }
      },
      select: {
        ingresoNeto: true,
        checkInDate: true
      }
    });

    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.ingresoNeto || 0), 0);
    const revenueThisMonth = allBookings
      .filter(b => b.checkInDate >= monthStart && b.checkInDate <= monthEnd)
      .reduce((sum, b) => sum + (b.ingresoNeto || 0), 0);

    // Rating promedio
    const reviews = await prisma.sTRReview.findMany({
      where: {
        listing: {
          companyId: session.user.companyId
        }
      },
      select: {
        rating: true
      }
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalReviews = reviews.length;

    // Tasa de ocupación (simplificada)
    const occupiedDays = await prisma.sTRBooking.aggregate({
      where: {
        listing: {
          companyId: session.user.companyId
        },
        estado: { in: ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT'] },
        checkInDate: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _sum: {
        numNoches: true
      }
    });

    const totalPossibleNights = activeListings * 30; // Simplificado
    const occupancyRate = totalPossibleNights > 0
      ? ((occupiedDays._sum?.numNoches || 0) / totalPossibleNights) * 100
      : 0;

    // Ingresos por mes (últimos 6 meses)
    const revenueByMonth: Array<{
      mes: string;
      ingresos: number;
    }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const bookingsInMonth = allBookings.filter(
        b => b.checkInDate >= start && b.checkInDate <= end
      );
      const revenue = bookingsInMonth.reduce((sum, b) => sum + (b.ingresoNeto || 0), 0);

      revenueByMonth.push({
        mes: format(monthDate, 'MMM yyyy', { locale: es }),
        ingresos: Math.round(revenue)
      });
    }

    // Reservas por canal
    const bookingsByChannelData = await prisma.sTRBooking.groupBy({
      by: ['canal'],
      where: {
        listing: {
          companyId: session.user.companyId
        }
      },
      _count: {
        id: true
      }
    });

    const bookingsByChannel = bookingsByChannelData.map(item => ({
      canal: item.canal,
      reservas: item._count.id
    }));

    // Top listings
    const topListingsData = await prisma.sTRListing.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        bookings: {
          where: {
            estado: { in: ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT'] }
          },
          select: {
            ingresoNeto: true
          }
        }
      },
      orderBy: {
        totalReservas: 'desc'
      },
      take: 5
    });

    const topListings = topListingsData.map(listing => ({
      id: listing.id,
      titulo: listing.titulo,
      totalReservas: listing.totalReservas,
      ingresoTotal: listing.bookings.reduce((sum: number, b: { ingresoNeto: number | null }) => sum + (b.ingresoNeto || 0), 0),
      ratingPromedio: listing.ratingPromedio || 0
    }));

    return NextResponse.json({
      totalListings,
      activeListings,
      totalBookings,
      bookingsThisMonth,
      totalRevenue: Math.round(totalRevenue),
      revenueThisMonth: Math.round(revenueThisMonth),
      averageRating,
      occupancyRate,
      totalReviews,
      confirmedBookings,
      checkInTodayBookings,
      checkOutTodayBookings,
      revenueByMonth,
      bookingsByChannel,
      topListings
    });
  } catch (error) {
    logger.error('Error fetching STR dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

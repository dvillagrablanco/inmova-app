import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session?.user?.companyId;
    // Obtener sincronizaciones de canales
    const channelSyncs = await prisma.sTRChannelSync.findMany({
      where: { companyId },
      include: {
        listing: {
          include: {
            bookings: true,
          },
        },
      },
    });
    // Agrupar por canal
    const channelMap = new Map<string, { bookings: number; revenue: number; nights: number; commission: number }>();
    for (const sync of channelSyncs) {
      const channelName = sync.canal || 'Directo';
      const bookings = sync.listing.bookings || [];
      
      const channelBookings = bookings.length;
      const channelRevenue = bookings.reduce((sum: number, b: any) => sum + (b.precioTotal || 0), 0);
      const channelNights = bookings.reduce((sum: number, b: any) => sum + (b.numNoches || 1), 0);
      const commission = Math.round(channelRevenue * 0.15); // 15% comisión estimada
      if (channelMap.has(channelName)) {
        const existing = channelMap.get(channelName)!;
        channelMap.set(channelName, {
          bookings: existing.bookings + channelBookings,
          revenue: existing.revenue + channelRevenue,
          nights: existing.nights + channelNights,
          commission: existing.commission + commission,
        });
      } else {
        channelMap.set(channelName, {
          bookings: channelBookings,
          revenue: channelRevenue,
          nights: channelNights,
          commission,
        });
      }
    }
    // Convertir a array
    const performance = Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      bookings: data.bookings,
      revenue: data.revenue,
      avgRate: data.nights > 0 ? Math.round(data.revenue / data.nights) : 0,
      commission: data.commission,
    }));
    // Ordenar por ingresos
    performance.sort((a, b) => b.revenue - a.revenue);
    return NextResponse.json(performance);
  } catch (error) {
    logger.error('Error fetching channel performance:', error);
    return NextResponse.json({ error: 'Error al obtener rendimiento de canales' }, { status: 500 });
  }
}

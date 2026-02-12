import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    // Obtener bookings completados para calcular revenue
    const bookings = await prisma.sTRBooking.findMany({
      where: {
        companyId,
        estado: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      select: {
        precioTotal: true,
        precioPorNoche: true,
        noches: true,
        checkIn: true,
        checkOut: true,
      },
    });

    const totalRevenue = bookings.reduce((s: number, b: any) => s + (Number(b.precioTotal) || 0), 0);
    const totalNights = bookings.reduce((s: number, b: any) => s + (b.noches || 0), 0);
    const avgNightlyRate = totalNights > 0 ? totalRevenue / totalNights : 0;

    // Obtener listings para occupancy
    const listings = await prisma.sTRListing.findMany({
      where: { companyId },
      select: { id: true },
    });

    const totalListings = listings.length;
    const occupancyRate = totalListings > 0 && totalNights > 0
      ? Math.min(100, Math.round((totalNights / (totalListings * 30)) * 100))
      : 0;

    // Estrategias de precios dinámicos
    const strategies = await prisma.sTRDynamicPricingRule.findMany({
      where: { listing: { companyId } },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        activa: true,
        ajustePorcentaje: true,
        listingId: true,
      },
    });

    const mappedStrategies = strategies.map((s: any) => ({
      id: s.id,
      name: s.nombre,
      type: s.tipo,
      active: s.activa,
      listings: 1,
      avgIncrease: Number(s.ajustePorcentaje) || 0,
    }));

    return NextResponse.json({
      revenueData: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyGrowth: 0,
        averageNightlyRate: Math.round(avgNightlyRate * 100) / 100,
        revPAR: totalListings > 0 ? Math.round((totalRevenue / totalListings) * 100) / 100 : 0,
        occupancyRate,
        adr: Math.round(avgNightlyRate * 100) / 100,
      },
      strategies: mappedStrategies,
    });
  } catch (error: any) {
    logger.error('[STR Revenue GET]:', error);
    return NextResponse.json({ error: 'Error al obtener revenue' }, { status: 500 });
  }
}

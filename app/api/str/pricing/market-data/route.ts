export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { subDays } from 'date-fns';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');
    const zona = searchParams.get('zona');

    // Obtener datos de mercado de la base de datos
    const marketDataQuery = await prisma.marketData.findMany({
      where: {
        companyId,
        ...(zona && { zona }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    // Obtener listings del usuario para calcular sus precios
    const listings = await prisma.sTRListing.findMany({
      where: {
        companyId,
        activo: true,
      },
      select: {
        precioPorNoche: true,
      },
    });

    // Obtener historial de pricing si existe
    const pricingHistory = await prisma.pricingAnalysis.findMany({
      where: {
        companyId,
        createdAt: {
          gte: subDays(new Date(), period),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Si hay datos de pricing history, usar esos
    if (pricingHistory.length > 0) {
      const marketData = pricingHistory.map((p) => ({
        date: p.createdAt.toISOString().split('T')[0],
        myPrice: p.precioSugerido || 0,
        avgMarketPrice: p.precioMercado || 0,
        occupancy: p.probabilidadAlquiler || 0,
      }));

      return NextResponse.json(marketData);
    }

    // Si hay datos de mercado estáticos, usarlos como base
    const latestMarketData = marketDataQuery[0];
    const avgUserPrice = listings.length > 0
      ? listings.reduce((sum, l) => sum + (l.precioPorNoche || 0), 0) / listings.length
      : 0;

    const avgMarketPrice = latestMarketData?.precioPromedio || avgUserPrice || 100;
    const occupancy = latestMarketData?.tasaOcupacion || 70;

    // Generar datos históricos basados en los datos disponibles (sin aleatoriedad)
    const marketData = Array.from({ length: period }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (period - i - 1));

      return {
        date: date.toISOString().split('T')[0],
        myPrice: avgUserPrice > 0 ? avgUserPrice : null,
        avgMarketPrice: avgMarketPrice,
        occupancy: Math.max(40, Math.min(95, occupancy)),
      };
    });

    return NextResponse.json(marketData);
  } catch (error) {
    logger.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de mercado' },
      { status: 500 }
    );
  }
}

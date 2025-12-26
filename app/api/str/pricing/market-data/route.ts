import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    // TODO: Implementar web scraping real de competencia
    // Por ahora generamos datos de ejemplo
    const marketData = Array.from({ length: period }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (period - i - 1));
      
      return {
        date: date.toISOString().split('T')[0],
        myPrice: 85 + Math.random() * 30,
        avgMarketPrice: 90 + Math.random() * 25,
        occupancy: 60 + Math.random() * 35,
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

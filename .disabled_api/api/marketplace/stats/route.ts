import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar cálculo real desde base de datos
    const stats = {
      totalServices: 156,
      totalBookings: 342,
      totalRevenue: 45280,
      commissionRate: 12,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

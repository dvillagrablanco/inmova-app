import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
// } from '@/lib/marketplace-service';

// GET /api/marketplace/stats - Obtener estadísticas del marketplace
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar cotizaciones expiradas
    // await checkExpiredQuotes(session.user.companyId);

    // const [stats, topProviders] = await Promise.all([
    //   getMarketplaceStats(session.user.companyId),
    //   getTopProviders(session.user.companyId, 5),
    // ]);
    
    const stats = { totalQuotes: 0, activeQuotes: 0, completedJobs: 0 };
    const topProviders: any[] = [];

    return NextResponse.json({
      ...stats,
      topProviders,
    });
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

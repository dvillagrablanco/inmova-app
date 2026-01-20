import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora, retornar datos vacíos
    // En el futuro, conectar con modelo real de comisiones
    return NextResponse.json({
      stats: {
        totalCommissionsThisMonth: 0,
        totalCommissionsAllTime: 0,
        pendingCommissions: 0,
        activeProviders: 0,
        avgCommissionRate: 0,
        transactionsThisMonth: 0,
      },
      services: [],
      transactions: [],
    });
  } catch (error) {
    logger.error('[API Error] Marketplace commissions:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

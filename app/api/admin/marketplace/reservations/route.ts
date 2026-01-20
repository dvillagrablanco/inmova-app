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
    // En el futuro, conectar con modelo real de reservas
    return NextResponse.json({
      stats: {
        total: 0,
        pendientes: 0,
        confirmadas: 0,
        completadas: 0,
        canceladas: 0,
        ingresosMes: 0,
        comisionesMes: 0,
      },
      reservations: [],
    });
  } catch (error) {
    logger.error('[API Error] Marketplace reservations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

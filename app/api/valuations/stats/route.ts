/**
 * API Endpoint: Estadísticas de Valoraciones
 * 
 * GET /api/valuations/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getValuationStats } from '@/lib/property-valuation-service';
import { withRateLimit } from '@/lib/rate-limiting';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      // 1. Autenticación
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const companyId = session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Company ID no encontrado' },
          { status: 400 }
        );
      }

      // 2. Obtener estadísticas
      const stats = await getValuationStats(companyId);

      // 3. Respuesta
      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error fetching valuation stats:', error);
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      );
    }
  });
}

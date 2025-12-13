/**
 * API ENDPOINT: Estadísticas del Sistema de Asignación
 * 
 * GET /api/providers/stats
 * 
 * Obtiene estadísticas generales del sistema de asignación de proveedores.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { getAssignmentStats } from '@/lib/provider-assignment-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    logger.info('Solicitando estadísticas de asignación', {
      userId: user.id,
      companyId: user.companyId,
    });

    const stats = await getAssignmentStats(user.companyId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logError(new Error(error.message || 'Error obteniendo estadísticas'), { context: 'GET /api/providers/stats' });

    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas',
      },
      { status: 500 }
    );
  }
}

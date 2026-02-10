import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { getApprovalStats } from '@/lib/enhanced-approval-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/approvals/stats
 * Obtiene estadísticas de aprobaciones
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    const stats = await getApprovalStats(user.companyId as string);

    return NextResponse.json(stats);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    if (error.message === 'No autenticado' || error.message === 'No autorizado' || error.message === 'Usuario inactivo') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    logger.error('Error obteniendo estadísticas de aprobaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}

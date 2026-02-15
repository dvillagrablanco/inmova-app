/**
 * API: Student Housing Stats
 * GET /api/student-housing/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const stats = await StudentHousingService.getStats(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('[Student Housing Stats Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas', message: error.message },
      { status: 500 }
    );
  }
}

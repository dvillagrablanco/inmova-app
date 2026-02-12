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
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const stats = await StudentHousingService.getStats(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[Student Housing Stats Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas', message: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViajesCorporativosService } from '@/lib/services/viajes-corporativos-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const stats = await ViajesCorporativosService.getStats(session.user.companyId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('[Viajes Corporativos Stats Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

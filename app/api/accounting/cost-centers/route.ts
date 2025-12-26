import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCenterOfCostsReport } from '@/lib/accounting-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = searchParams.get('periodo') || new Date().toISOString().slice(0, 7);

    const costCenters = await getCenterOfCostsReport(session.user.companyId, periodo);

    return NextResponse.json({
      success: true,
      data: costCenters,
      periodo,
    });
  } catch (error) {
    logger.error('Error al obtener centros de coste:', error);
    return NextResponse.json({ error: 'Error al obtener centros de coste' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAnalyticalAccounting } from '@/lib/accounting-service';
import { startOfMonth, endOfMonth, subMonths, parse } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = searchParams.get('periodo') || new Date().toISOString().slice(0, 7);

    // Parsear período (formato YYYY-MM)
    const [year, month] = periodo.split('-').map(Number);
    const fechaInicio = startOfMonth(new Date(year, month - 1));
    const fechaFin = endOfMonth(new Date(year, month - 1));

    const analyticalData = await getAnalyticalAccounting(
      session.user.companyId,
      fechaInicio,
      fechaFin
    );

    return NextResponse.json({
      success: true,
      data: analyticalData,
      periodo,
    });
  } catch (error) {
    logger.error('Error al obtener contabilidad analítica:', error);
    return NextResponse.json(
      { error: 'Error al obtener contabilidad analítica' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getProfitLossStatement } from '@/lib/accounting-service';
import { startOfMonth, endOfMonth } from 'date-fns';

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

    const profitLoss = await getProfitLossStatement(
      session.user.companyId,
      fechaInicio,
      fechaFin
    );

    return NextResponse.json({
      success: true,
      data: profitLoss,
      periodo,
    });
  } catch (error) {
    console.error('Error al obtener cuenta de pérdidas y ganancias:', error);
    return NextResponse.json(
      { error: 'Error al obtener cuenta de pérdidas y ganancias' },
      { status: 500 }
    );
  }
}

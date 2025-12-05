import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateCashFlowForecast,
  CashFlowForecastParams,
} from '@/lib/services/treasury-service-simple';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/treasury/forecast:
 *   get:
 *     summary: Obtener previsiones de cash flow
 *     tags: [Tesorería]
 *   post:
 *     summary: Generar nuevas previsiones
 *     tags: [Tesorería]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    const forecasts = await prisma.cashFlowForecast.findMany({
      where: { companyId },
      orderBy: { mes: 'asc' },
    });

    return NextResponse.json(forecasts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener previsiones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const params: CashFlowForecastParams = {
      companyId: body.companyId,
      mesesAdelante: body.mesesAdelante || 6,
    };

    const forecasts = await generateCashFlowForecast(params);

    return NextResponse.json(forecasts, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al generar previsiones' },
      { status: 500 }
    );
  }
}

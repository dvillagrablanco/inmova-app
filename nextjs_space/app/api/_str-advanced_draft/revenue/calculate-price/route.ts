/**
 * API para calcular precio dinámico
 * POST /api/str-advanced/revenue/calculate-price
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { calculateDynamicPrice } from '@/lib/str-advanced-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { basePrice, date, occupancyRate, daysUntilCheckIn, minimumStay, seasonType } = body;

    if (!basePrice || !date || occupancyRate === undefined || daysUntilCheckIn === undefined) {
      return NextResponse.json(
        { error: 'Parámetros requeridos faltantes' },
        { status: 400 }
      );
    }

    const result = calculateDynamicPrice({
      basePrice,
      date: new Date(date),
      occupancyRate,
      daysUntilCheckIn,
      minimumStay: minimumStay || 1,
      seasonType
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculando precio:', error);
    return NextResponse.json(
      { error: error.message || 'Error calculando precio' },
      { status: 500 }
    );
  }
}

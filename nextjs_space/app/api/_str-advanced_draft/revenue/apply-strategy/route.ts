/**
 * API para aplicar estrategia de pricing
 * POST /api/str-advanced/revenue/apply-strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyPricingStrategy } from '@/lib/str-advanced-service';

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
    const { listingId, strategyId, startDate, endDate } = body;

    if (!listingId || !strategyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'listingId, strategyId, startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const result = await applyPricingStrategy(
      listingId,
      strategyId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error aplicando estrategia:', error);
    return NextResponse.json(
      { error: error.message || 'Error aplicando estrategia' },
      { status: 500 }
    );
  }
}

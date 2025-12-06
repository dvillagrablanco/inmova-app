/**
 * API para calcular tasa turística
 * POST /api/str-advanced/legal/calculate-tax
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { calculateTouristTax } from '@/lib/str-advanced-service';

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
    const { numGuests, numNights, city } = body;

    if (!numGuests || !numNights || !city) {
      return NextResponse.json(
        { error: 'numGuests, numNights y city son requeridos' },
        { status: 400 }
      );
    }

    const tax = calculateTouristTax(numGuests, numNights, city);

    return NextResponse.json(tax);
  } catch (error: any) {
    console.error('Error calculando tasa:', error);
    return NextResponse.json(
      { error: error.message || 'Error calculando tasa' },
      { status: 500 }
    );
  }
}

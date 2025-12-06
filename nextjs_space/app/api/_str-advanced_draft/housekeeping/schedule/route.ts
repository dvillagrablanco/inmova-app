/**
 * API para obtener calendario de limpieza
 * GET /api/str-advanced/housekeeping/schedule?startDate=2024-01-01&endDate=2024-01-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCleaningSchedule } from '@/lib/str-advanced-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const schedule = await getCleaningSchedule(
      session.user.companyId,
      new Date(startDateParam),
      new Date(endDateParam)
    );

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('Error obteniendo calendario:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo calendario' },
      { status: 500 }
    );
  }
}

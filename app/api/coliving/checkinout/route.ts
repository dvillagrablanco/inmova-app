import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }
    const result = await conciergeService.getPendingCheckInOuts(companyId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.checkInOuts);
  } catch (error) {
    logger.error('Error en GET /api/coliving/checkinout:', error);
    return NextResponse.json({ error: 'Error al obtener check-ins/outs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const result = await conciergeService.createCheckInOut({
      ...body,
      fechaProgramada: new Date(body.fechaProgramada),
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.checkInOut, { status: 201 });
  } catch (error) {
    logger.error('Error en POST /api/coliving/checkinout:', error);
    return NextResponse.json({ error: 'Error al crear check-in/out' }, { status: 500 });
  }
}

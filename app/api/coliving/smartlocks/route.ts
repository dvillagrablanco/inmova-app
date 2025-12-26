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
    const buildingId = searchParams.get('buildingId');
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId requerido' }, { status: 400 });
    }
    const result = await conciergeService.getSmartLocksByBuilding(buildingId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.locks);
  } catch (error) {
    logger.error('Error en GET /api/coliving/smartlocks:', error);
    return NextResponse.json({ error: 'Error al obtener SmartLocks' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const result = await conciergeService.registerSmartLock(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.lock, { status: 201 });
  } catch (error) {
    logger.error('Error en POST /api/coliving/smartlocks:', error);
    return NextResponse.json({ error: 'Error al registrar SmartLock' }, { status: 500 });
  }
}

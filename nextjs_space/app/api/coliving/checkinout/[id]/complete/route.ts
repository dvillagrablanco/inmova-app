import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

export const dynamic = 'force-dynamic';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id: checkInOutId } = params;
    const { tipo, ...data } = await request.json();
    let result;
    if (tipo === 'check_in') {
      result = await conciergeService.completeCheckIn(checkInOutId, data);
    } else {
      result = await conciergeService.completeCheckOut(checkInOutId, data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.checkInOut);
  } catch (error) {
    logger.error('Error en POST /api/coliving/checkinout/[id]/complete:', error);
    return NextResponse.json(
      { error: 'Error al completar check-in/out' },
      { status: 500 }
    );
  }
}

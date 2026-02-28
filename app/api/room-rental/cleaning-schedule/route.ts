import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateCleaningSchedule, saveCleaningScheduleToContracts } from '@/lib/room-rental-service';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const cleaningScheduleSchema = z.object({
  unitId: z.string().min(1),
  startDate: z.string().optional(),
});
export const runtime = 'nodejs';

/**
 * GET /api/room-rental/cleaning-schedule
 * Obtiene el calendario de limpieza de una unidad
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const startDate = searchParams.get('startDate');
    const weeksAhead = searchParams.get('weeksAhead');

    if (!unitId) {
      return NextResponse.json(
        { error: 'Falta parámetro: unitId' },
        { status: 400 }
      );
    }

    const schedule = await generateCleaningSchedule(
      unitId,
      session.user.companyId,
      startDate ? new Date(startDate) : new Date(),
      weeksAhead ? parseInt(weeksAhead) : 12
    );

    return NextResponse.json(schedule);
  } catch (error: any) {
    logger.error('Error fetching cleaning schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/room-rental/cleaning-schedule
 * Genera y guarda el calendario de limpieza en los contratos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = cleaningScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { unitId, startDate } = parsed.data;

    const schedule = await saveCleaningScheduleToContracts(
      unitId,
      session.user.companyId,
      startDate ? new Date(startDate) : new Date()
    );

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Calendario de limpieza generado y guardado correctamente',
    });
  } catch (error: any) {
    logger.error('Error saving cleaning schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

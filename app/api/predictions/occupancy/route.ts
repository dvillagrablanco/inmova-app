import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { predictOccupancy } from '@/lib/prediction-service';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const occupancySchema = z.object({
  monthsAhead: z.number().int().min(1).max(24).optional().default(3),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = occupancySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { monthsAhead } = parsed.data;
    const companyId = session?.user?.companyId;

    const predictions = await predictOccupancy(companyId, monthsAhead);

    return NextResponse.json({ predictions }, { status: 201 });
  } catch (error: any) {
    logger.error('Error predicting occupancy:', error);
    return NextResponse.json(
      { error: error.message || 'Error al predecir ocupación' },
      { status: 500 }
    );
  }
}

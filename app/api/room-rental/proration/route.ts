import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyUtilityProrationToUnit, calculateUtilityProration } from '@/lib/room-rental-service';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type ProrationMethod = 'equal' | 'combined' | 'by_surface' | 'by_occupants';

const prorationSchema = z.object({
  unitId: z.string().min(1),
  utilities: z.object({
    electricity: z.number().optional(),
    water: z.number().optional(),
    gas: z.number().optional(),
    internet: z.number().optional(),
    cleaning: z.number().optional(),
  }),
  prorationMethod: z.string().optional(),
});
export const runtime = 'nodejs';

/**
 * POST /api/room-rental/proration
 * Calcula y aplica el prorrateo de suministros a una unidad
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = prorationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { unitId, utilities, prorationMethod } = parsed.data;

    const result = await applyUtilityProrationToUnit(
      unitId,
      session.user.companyId,
      {
        electricity: utilities.electricity,
        water: utilities.water,
        gas: utilities.gas,
        internet: utilities.internet,
        cleaning: utilities.cleaning,
      },
      (prorationMethod || 'combined') as ProrationMethod
    );

    return NextResponse.json({
      success: true,
      ...result,
      message: `Prorrateo aplicado correctamente a ${result.paymentsCreated.length} habitaciones`,
    });
  } catch (error: any) {
    logger.error('Error applying proration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/room-rental/proration
 * Calcula el prorrateo sin aplicarlo (simulación)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const totalAmount = searchParams.get('totalAmount');
    const prorationMethod = searchParams.get('prorationMethod') || 'combined';
    const roomsData = searchParams.get('rooms');

    if (!totalAmount || !roomsData) {
      return NextResponse.json(
        { error: 'Faltan parámetros: totalAmount y rooms' },
        { status: 400 }
      );
    }

    const rooms = JSON.parse(roomsData);

    const result = await calculateUtilityProration({
      totalAmount: parseFloat(totalAmount),
      rooms,
      prorationMethod: prorationMethod as ProrationMethod,
    });

    return NextResponse.json({
      totalAmount: parseFloat(totalAmount),
      method: prorationMethod,
      distribution: result,
    });
  } catch (error: any) {
    logger.error('Error calculating proration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

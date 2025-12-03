import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyUtilityProrationToUnit, calculateUtilityProration } from '@/lib/room-rental-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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

    const data = await request.json();

    // Validaciones
    if (!data.unitId || !data.utilities) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: unitId y utilities' },
        { status: 400 }
      );
    }

    const prorationMethod = data.prorationMethod || 'combined';

    // Aplicar prorrateo
    const result = await applyUtilityProrationToUnit(
      data.unitId,
      session.user.companyId,
      {
        electricity: data.utilities.electricity,
        water: data.utilities.water,
        gas: data.utilities.gas,
        internet: data.utilities.internet,
        cleaning: data.utilities.cleaning,
      },
      prorationMethod
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
      prorationMethod: prorationMethod as any,
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

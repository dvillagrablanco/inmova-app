/**
 * API: Student Housing Payments
 * GET /api/student-housing/payments - Lista pagos
 * PATCH /api/student-housing/payments - Actualizar estado de pago
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      mes: searchParams.get('mes') || undefined,
    };

    const payments = await StudentHousingService.getPayments(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: payments
    });
  } catch (error: any) {
    logger.error('[Student Housing Payments GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo pagos', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, estado, metodoPago } = z.object({
      id: z.string(),
      estado: z.string(),
      metodoPago: z.string().optional()
    }).parse(body);

    await StudentHousingService.updatePaymentStatus(id, estado, metodoPago);

    return NextResponse.json({
      success: true,
      message: 'Estado de pago actualizado'
    });
  } catch (error: any) {
    logger.error('[Student Housing Payments PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando pago', message: error.message },
      { status: 500 }
    );
  }
}

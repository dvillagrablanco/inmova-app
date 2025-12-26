/**
 * API de Check-In para Órdenes de Trabajo
 * POST - Registra el check-in del operador en una orden de trabajo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkInWorkOrder } from '@/lib/work-order-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Verificar que es un operador
    if (role !== 'operador') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { location, notes } = body;

    // Registrar check-in
    const updated = await checkInWorkOrder({
      workOrderId: params.id,
      operatorId: userId,
      checkInTime: new Date(),
      location,
      notes,
    });

    logger.info(`Operador ${userId} hizo check-in en orden ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/operador/work-orders/[id]/check-in',
      workOrderId: params.id,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al hacer check-in' },
      { status: 500 }
    );
  }
}

/**
 * API de Check-Out para Órdenes de Trabajo
 * POST - Registra el check-out del operador de una orden de trabajo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkOutWorkOrder } from '@/lib/work-order-service';
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
    const { location, workCompleted, completionNotes, nextActions } = body;

    // Registrar check-out
    const updated = await checkOutWorkOrder({
      workOrderId: params.id,
      operatorId: userId,
      checkOutTime: new Date(),
      location,
      workCompleted,
      completionNotes,
      nextActions,
    });

    logger.info(`Operador ${userId} hizo check-out en orden ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/operador/work-orders/[id]/check-out',
      workOrderId: params.id,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al hacer check-out' },
      { status: 500 }
    );
  }
}

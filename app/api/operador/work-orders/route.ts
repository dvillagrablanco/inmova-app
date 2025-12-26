/**
 * API de Órdenes de Trabajo para Operadores
 * GET - Obtiene órdenes de trabajo del día para el operador autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTodayWorkOrders } from '@/lib/work-order-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const companyId = (session.user as any).companyId;
    const role = (session.user as any).role;

    // Verificar que es un operador
    if (role !== 'operador') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo operadores pueden acceder a este recurso' },
        { status: 403 }
      );
    }

    // Obtener órdenes de trabajo del día
    const workOrders = await getTodayWorkOrders(userId, companyId);

    logger.info(`Operador ${userId} obtuvo ${workOrders.length} órdenes del día`);

    return NextResponse.json(workOrders);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/operador/work-orders',
    });
    return NextResponse.json({ error: 'Error al obtener órdenes de trabajo' }, { status: 500 });
  }
}

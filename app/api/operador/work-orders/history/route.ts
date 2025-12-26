/**
 * API de Historial de Órdenes de Trabajo para Operadores
 * GET - Obtiene el historial completo de órdenes del operador
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOperatorWorkHistory } from '@/lib/work-order-service';
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

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const filters: any = {};
    if (estado) filters.estado = estado;
    if (buildingId) filters.buildingId = buildingId;
    if (startDateStr) filters.startDate = new Date(startDateStr);
    if (endDateStr) filters.endDate = new Date(endDateStr);

    // Obtener historial
    const workOrders = await getOperatorWorkHistory(userId, companyId, filters);

    logger.info(`Operador ${userId} obtuvo historial con ${workOrders.length} órdenes`);

    return NextResponse.json(workOrders);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/operador/work-orders/history',
    });
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

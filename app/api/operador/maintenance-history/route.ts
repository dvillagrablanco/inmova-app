/**
 * API de Historial de Mantenimiento para Operadores
 * GET - Obtiene el historial completo de mantenimiento de la empresa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMaintenanceHistory } from '@/lib/work-order-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

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
    const prioridad = searchParams.get('prioridad') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const filters: any = {};
    if (estado) filters.estado = estado;
    if (buildingId) filters.buildingId = buildingId;
    if (prioridad) filters.prioridad = prioridad;
    if (startDateStr) filters.startDate = new Date(startDateStr);
    if (endDateStr) filters.endDate = new Date(endDateStr);

    // Obtener historial de mantenimiento
    const maintenanceHistory = await getMaintenanceHistory(companyId, filters);

    logger.info(
      `Operador obtuvo historial de mantenimiento con ${maintenanceHistory.length} solicitudes`
    );

    return NextResponse.json(maintenanceHistory);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/operador/maintenance-history',
    });
    return NextResponse.json(
      { error: 'Error al obtener historial de mantenimiento' },
      { status: 500 }
    );
  }
}

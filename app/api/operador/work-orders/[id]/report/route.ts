/**
 * API de Reportes para Órdenes de Trabajo
 * POST - Crea un reporte de trabajo completado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createWorkReport } from '@/lib/work-order-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Verificar que es un operador
    if (role !== 'operador') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, timeSpent, materials, photos, issuesFound, recommendations } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Se requiere descripción del reporte' },
        { status: 400 }
      );
    }

    // Crear reporte
    const updated = await createWorkReport({
      workOrderId: params.id,
      operatorId: userId,
      description,
      timeSpent: timeSpent || 0,
      materials,
      photos,
      issuesFound,
      recommendations,
    });

    logger.info(`Operador ${userId} creó reporte para orden ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/operador/work-orders/[id]/report',
      workOrderId: params.id,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear reporte' },
      { status: 500 }
    );
  }
}

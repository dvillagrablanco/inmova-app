/**
 * API de Estadísticas para Operadores
 * GET - Obtiene estadísticas del operador autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOperatorStats } from '@/lib/work-order-service';
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

    // Obtener estadísticas
    const stats = await getOperatorStats(userId, companyId);

    logger.info(`Operador ${userId} obtuvo estadísticas`);

    return NextResponse.json(stats);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/operador/stats',
    });
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

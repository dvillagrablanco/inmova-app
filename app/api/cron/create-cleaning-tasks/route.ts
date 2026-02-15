export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { autoCreateCleaningTasks } from '@/lib/cron-service';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { requireCronSecret } from '@/lib/api-auth-guard';

/**
 * API Route: Creación automática de tareas de limpieza
 * POST /api/cron/create-cleaning-tasks
 */
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  try {
    const authResult = await authorizeCronRequest(request, {
      allowSession: true,
      requireSuperAdmin: true,
    });
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'No autorizado' },
        { status: authResult.status }
      );
    }
    const body = await request.json().catch(() => ({}));
    const session = await getServerSession(authOptions);
    const companyId = body.companyId || session?.user?.companyId;
    const result = await autoCreateCleaningTasks(companyId);
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Tareas creadas: ${result.itemsProcessed}`
        : 'Creación completada con errores',
      data: result
    });
  } catch (error) {
    logger.error('[API] Error en creación de tareas:', error);
    return NextResponse.json(
      { 
        error: 'Error en creación de tareas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

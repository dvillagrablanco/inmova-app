export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { executeCronJob, executeAllCronJobs, cronJobs } from '@/lib/cron-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireCronSecret } from '@/lib/api-auth-guard';

/**
 * API Route: Ejecutar trabajos cron manualmente
 * 
 * POST /api/cron/execute
 * Body: { jobId?: string, all?: boolean }
 */
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  try {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
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
    const { jobId, all } = body;
    const session = await getServerSession(authOptions);
    const companyId = body.companyId || session?.user?.companyId;
    if (all) {
      const results = await executeAllCronJobs(companyId);
      
      return NextResponse.json({
        success: true,
        message: 'Todos los trabajos ejecutados',
        data: results
      });
    } else if (jobId) {
      const result = await executeCronJob(jobId, companyId);
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Trabajo completado. ${result.itemsProcessed} items procesados.`
          : 'Trabajo completado con errores',
        data: result
      });
    } else {
      return NextResponse.json(
        { error: 'Debe especificar jobId o all=true' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('[API] Error ejecutando trabajo cron:', error);
    return NextResponse.json(
      { 
        error: 'Error ejecutando trabajo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
/**
 * GET /api/cron/execute
 * Obtiene lista de trabajos cron disponibles
 */
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
  try {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
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
    return NextResponse.json({
      success: true,
      jobs: cronJobs
    });
  } catch (error) {
    logger.error('[API] Error obteniendo trabajos cron:', error);
    return NextResponse.json(
      { error: 'Error obteniendo trabajos' },
      { status: 500 }
    );
  }
}

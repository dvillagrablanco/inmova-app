import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { executeCronJob, executeAllCronJobs, cronJobs } from '@/lib/cron-service';

/**
 * API Route: Ejecutar trabajos cron manualmente
 *
 * POST /api/cron/execute
 * Body: { jobId?: string, all?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { jobId, all } = body;
    const companyId = body.companyId || session?.user?.companyId;
    if (all) {
      console.log(`[API] Ejecutando todos los trabajos cron para empresa: ${companyId}`);
      const results = await executeAllCronJobs(companyId);

      return NextResponse.json({
        success: true,
        message: 'Todos los trabajos ejecutados',
        data: results,
      });
    } else if (jobId) {
      console.log(`[API] Ejecutando trabajo cron: ${jobId} para empresa: ${companyId}`);
      const result = await executeCronJob(jobId, companyId);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Trabajo completado. ${result.itemsProcessed} items procesados.`
          : 'Trabajo completado con errores',
        data: result,
      });
    } else {
      return NextResponse.json({ error: 'Debe especificar jobId o all=true' }, { status: 400 });
    }
  } catch (error) {
    logger.error('[API] Error ejecutando trabajo cron:', error);
    return NextResponse.json(
      {
        error: 'Error ejecutando trabajo',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
/**
 * GET /api/cron/execute
 * Obtiene lista de trabajos cron disponibles
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      jobs: cronJobs,
    });
  } catch (error) {
    logger.error('[API] Error obteniendo trabajos cron:', error);
    return NextResponse.json({ error: 'Error obteniendo trabajos' }, { status: 500 });
  }
}

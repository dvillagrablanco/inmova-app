export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { syncAvailabilityToChannels } from '@/lib/cron-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { requireCronSecret } from '@/lib/api-auth-guard';

/**
 * API Route: Sincronización manual de disponibilidad a canales
 * POST /api/cron/sync-availability
 */
export async function POST(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const session = await getServerSession(authOptions);
    const companyId = body.companyId || session?.user?.companyId;
    const result = await syncAvailabilityToChannels(companyId);
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Sincronización completada. ${result.itemsProcessed} canales actualizados.`
        : 'Sincronización completada con errores',
      data: result
    });
  } catch (error) {
    logger.error('[API] Error en sincronización de disponibilidad:', error);
    return NextResponse.json(
      { 
        error: 'Error en sincronización',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

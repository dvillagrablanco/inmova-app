import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncAvailabilityToChannels } from '@/lib/cron-service';

/**
 * API Route: Sincronización manual de disponibilidad a canales
 * POST /api/cron/sync-availability
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const companyId = body.companyId || session?.user?.companyId;
    console.log(`[API] Iniciando sincronización de disponibilidad para empresa: ${companyId}`);
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

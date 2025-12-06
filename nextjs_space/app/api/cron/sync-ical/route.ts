import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncAllICalFeeds } from '@/lib/cron-service';

/**
 * API Route: Sincronización manual de calendarios iCal
 * POST /api/cron/sync-ical
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
    const companyId = body.companyId || session.user.companyId;
    console.log(`[API] Iniciando sincronización manual de iCal para empresa: ${companyId}`);
    const result = await syncAllICalFeeds(companyId);
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Sincronización completada. ${result.itemsProcessed} eventos procesados.`
        : 'Sincronización completada con errores',
      data: result
    });
  } catch (error) {
    logger.error('[API] Error en sincronización iCal:', error);
    return NextResponse.json(
      { 
        error: 'Error en sincronización',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

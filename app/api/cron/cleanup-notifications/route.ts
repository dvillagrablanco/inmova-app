export const dynamic = 'force-dynamic';

/**
 * API: GET /api/cron/cleanup-notifications
 * Cron job para limpiar notificaciones expiradas
 * 
 * Ejecutar diariamente via cron externo o Vercel Cron:
 * 0 2 * * * (a las 2 AM todos los días)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredNotifications } from '@/lib/notification-service';

import logger from '@/lib/logger';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { requireCronSecret } from '@/lib/api-auth-guard';
export async function GET(request: NextRequest) {
  // Cron auth guard
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;
    return NextResponse.json({ error: cronAuth.error || 'No autorizado' }, { status: cronAuth.status });
  }

  try {
    // Validar que viene desde un cron job (opcional: usar token secreto)
    const authHeader = process.env.CRON_SECRET;
    // if (request.headers.get('authorization') !== `Bearer ${authHeader}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const deletedCount = await cleanupExpiredNotifications();

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CRON cleanup-notifications] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

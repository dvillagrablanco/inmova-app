/**
 * API: Procesar alertas de documentos ewoorker
 * POST /api/ewoorker/notifications/alerts
 *
 * Se ejecuta via cron para enviar alertas de documentos próximos a vencer
 */

import { NextRequest, NextResponse } from 'next/server';
import { ewoorkerNotifications } from '@/lib/ewoorker-notifications-service';

import logger from '@/lib/logger';
import { requireSession } from '@/lib/api-auth-guard';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  try {
    // Verificar cron secret (para llamadas desde Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await ewoorkerNotifications.processDocumentAlerts();

    return NextResponse.json({
      success: true,
      results,
      message: `Alertas procesadas: ${results.vencidos} vencidos, ${results.alertas7dias} en 7 días, ${results.alertas15dias} en 15 días, ${results.alertas30dias} en 30 días`,
    });
  } catch (error: any) {
    logger.error('[EWOORKER_NOTIFICATIONS_ALERTS]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET: Estado de alertas (para monitoreo)
 */
export async function GET() {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  try {
    return NextResponse.json({
      status: 'ok',
      service: 'ewoorker-document-alerts',
      description: 'Servicio de alertas de documentos eWoorker',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

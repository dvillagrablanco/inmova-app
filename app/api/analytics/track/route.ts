export const dynamic = 'force-dynamic';

/**
 * API: POST /api/analytics/track
 * Endpoint para enviar eventos de analytics desde el cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
type AnalyticsEventName = string;
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener sesión (opcional, permite tracking anónimo)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 2. Obtener datos del evento
    const body = await request.json();
    const { eventName, properties } = body;

    // 3. Validar que el eventName sea válido
    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid eventName' },
        { status: 400 }
      );
    }

    // 4. Enviar evento
    const { trackEvent } = (await import('@/lib/analytics-service')) as any;
    await trackEvent(eventName as AnalyticsEventName, properties || {}, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API /analytics/track] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

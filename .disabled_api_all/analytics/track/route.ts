/**
 * API: POST /api/analytics/track
 * Endpoint para enviar eventos de analytics desde el cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackEvent, AnalyticsEventName } from '@/lib/analytics-service';

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
    await trackEvent(eventName as AnalyticsEventName, properties || {}, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /analytics/track] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

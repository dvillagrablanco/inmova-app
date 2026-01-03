/**
 * Webhook Endpoint: Signaturit
 * 
 * Recibe notificaciones de eventos de firma digital
 * 
 * POST /api/webhooks/signaturit
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignaturitService } from '@/lib/signaturit-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Parsear payload
    const payload = await req.json();

    logger.info('📥 Signaturit webhook received', {
      event: payload.event,
      signatureId: payload.data?.id,
    });

    // 2. Verificar firma del webhook (opcional pero recomendado en producción)
    // const signature = req.headers.get('x-signaturit-signature');
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // 3. Procesar webhook
    await SignaturitService.processWebhook(payload);

    // 4. Responder 200 OK inmediatamente
    return NextResponse.json({
      success: true,
      received: true,
      event: payload.event,
    });

  } catch (error: any) {
    logger.error('❌ Error processing Signaturit webhook:', error);

    // Aún así responder 200 para evitar reintentos
    // (el error ya se guardó en BD)
    return NextResponse.json({
      success: false,
      error: 'Internal error',
      message: error.message,
    }, { status: 200 });
  }
}

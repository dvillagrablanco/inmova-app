/**
 * Webhook de GoCardless para procesar eventos de SEPA
 * 
 * Eventos manejados:
 * - payments.confirmed/paid_out/failed/cancelled
 * - mandates.active/failed/cancelled
 * - subscriptions.payment_created/cancelled
 * 
 * @endpoint POST /api/webhooks/gocardless
 */

import { NextRequest, NextResponse } from 'next/server';
import { processGoCardlessWebhook } from '@/lib/sepa-direct-debit-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Obtener firma del header
    const signature = req.headers.get('Webhook-Signature') || '';
    
    if (!signature) {
      logger.warn('⚠️ Webhook GoCardless sin firma');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Obtener body raw
    const rawBody = await req.text();
    
    // Parsear eventos
    let events: any[];
    try {
      const parsed = JSON.parse(rawBody);
      events = parsed.events || [];
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (events.length === 0) {
      return NextResponse.json({ message: 'No events to process' });
    }

    logger.info(`📥 Webhook GoCardless: ${events.length} eventos recibidos`);

    // Procesar eventos
    const result = await processGoCardlessWebhook(events, signature, rawBody);

    if (result.errors.length > 0) {
      logger.warn(`⚠️ Errores en webhook: ${result.errors.join(', ')}`);
    }

    logger.info(`✅ Webhook procesado: ${result.processed} eventos`);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error: any) {
    logger.error('Error en webhook GoCardless:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error.message },
      { status: 500 }
    );
  }
}

// GoCardless puede hacer GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'GoCardless webhook',
    timestamp: new Date().toISOString(),
  });
}

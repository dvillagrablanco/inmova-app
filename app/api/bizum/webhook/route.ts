/**
 * API: Webhook Bizum/Redsys
 * POST - Procesa notificaciones de pago Bizum (sin autenticación)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBizumClient } from '@/lib/bizum-integration';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    const client = getBizumClient();
    if (!client) {
      logger.warn('Bizum webhook received but Bizum is not configured');
      return NextResponse.json({ received: true });
    }

    const result = await client.processWebhook(body);

    logger.info('Bizum webhook processed', {
      reference: result.reference,
      status: result.status,
      transactionId: result.transactionId,
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logger.error('Error processing Bizum webhook:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

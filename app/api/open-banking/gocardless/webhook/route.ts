import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/gocardless/webhook
 * 
 * Webhook de GoCardless para recibir eventos de pagos, mandatos, etc.
 * Configurar en: GoCardless Dashboard > Developers > Create > Webhook
 * URL: https://inmovaapp.com/api/open-banking/gocardless/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('Webhook-Signature') || '';
    const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET || '';

    // Verify signature
    if (webhookSecret) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(body);
      const expectedSig = hmac.digest('hex');
      if (expectedSig !== signature) {
        logger.warn('[GC Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 498 });
      }
    }

    const payload = JSON.parse(body);
    const events = payload.events || [];
    const prisma = getPrismaClient();

    for (const event of events) {
      const { resource_type, action, links } = event;

      logger.info(`[GC Webhook] ${resource_type}.${action} (${event.id})`);

      switch (resource_type) {
        case 'payments': {
          const paymentId = links?.payment;
          if (!paymentId) break;

          if (action === 'confirmed' || action === 'paid_out') {
            // Payment successful - update in DB
            await prisma.bankTransaction.updateMany({
              where: { proveedorTxId: paymentId },
              data: { estado: 'conciliado' },
            });
            logger.info(`[GC Webhook] Payment ${paymentId} -> conciliado`);
          } else if (action === 'failed' || action === 'charged_back' || action === 'cancelled') {
            await prisma.bankTransaction.updateMany({
              where: { proveedorTxId: paymentId },
              data: { estado: 'descartado' },
            });
            logger.info(`[GC Webhook] Payment ${paymentId} -> descartado (${action})`);
          }
          break;
        }

        case 'mandates': {
          const mandateId = links?.mandate;
          if (!mandateId) break;

          if (action === 'cancelled' || action === 'expired' || action === 'failed') {
            await prisma.bankConnection.updateMany({
              where: { proveedorItemId: mandateId, proveedor: 'gocardless' },
              data: { estado: 'desconectado', desconectadaEn: new Date() },
            });
            logger.info(`[GC Webhook] Mandate ${mandateId} -> desconectado (${action})`);
          } else if (action === 'active') {
            await prisma.bankConnection.updateMany({
              where: { proveedorItemId: mandateId, proveedor: 'gocardless' },
              data: { estado: 'conectado' },
            });
            logger.info(`[GC Webhook] Mandate ${mandateId} -> conectado`);
          }
          break;
        }

        case 'subscriptions': {
          const subscriptionId = links?.subscription;
          if (action === 'cancelled' || action === 'finished') {
            logger.info(`[GC Webhook] Subscription ${subscriptionId} ${action}`);
          }
          break;
        }
      }
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error: any) {
    logger.error('[GC Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

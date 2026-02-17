import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import { centsToEuros } from '@/lib/gocardless-integration';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/gocardless/webhook
 *
 * Webhook de GoCardless para recibir eventos de pagos, mandatos, suscripciones y payouts.
 * Configurar en: GoCardless Dashboard > Developers > Webhooks
 * URL: https://inmovaapp.com/api/gocardless/webhook
 *
 * Eventos clave procesados:
 * - payments.confirmed / payments.paid_out -> marcar como cobrado
 * - payments.failed / payments.charged_back -> marcar como fallido
 * - mandates.active -> mandato activado
 * - mandates.cancelled / expired / failed -> mandato desactivado
 * - payouts.paid -> payout recibido en cuenta
 * - subscriptions.cancelled / finished -> suscripción terminada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('Webhook-Signature') || '';
    const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET || '';

    // Verificar firma HMAC
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

    let processed = 0;
    let errors = 0;

    for (const event of events) {
      const { resource_type, action, links, id: eventId } = event;

      // Guardar evento para auditoría
      try {
        await prisma.gCWebhookEvent.upsert({
          where: { gcEventId: eventId },
          update: { processed: true, processedAt: new Date() },
          create: {
            gcEventId: eventId,
            resourceType: resource_type,
            action,
            resourceId: links?.[resource_type?.slice(0, -1)] || '',
            payload: event,
            processed: false,
          },
        });
      } catch (e) {
        // Non-critical: continue processing even if logging fails
      }

      logger.info(`[GC Webhook] ${resource_type}.${action} (${eventId})`);

      try {
        switch (resource_type) {
          case 'payments':
            await handlePaymentEvent(prisma, action, links, event);
            break;

          case 'mandates':
            await handleMandateEvent(prisma, action, links, event);
            break;

          case 'subscriptions':
            await handleSubscriptionEvent(prisma, action, links, event);
            break;

          case 'payouts':
            await handlePayoutEvent(prisma, action, links, event);
            break;

          case 'refunds':
            await handleRefundEvent(prisma, action, links, event);
            break;

          default:
            logger.info(`[GC Webhook] Unhandled resource: ${resource_type}.${action}`);
        }

        // Marcar como procesado
        await prisma.gCWebhookEvent.updateMany({
          where: { gcEventId: eventId },
          data: { processed: true, processedAt: new Date() },
        });

        processed++;
      } catch (err: any) {
        logger.error(`[GC Webhook] Error processing ${resource_type}.${action}:`, err);

        await prisma.gCWebhookEvent.updateMany({
          where: { gcEventId: eventId },
          data: { processed: false, error: err.message },
        });

        errors++;
      }
    }

    return NextResponse.json({ success: true, processed, errors, total: events.length });
  } catch (error: any) {
    logger.error('[GC Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handlePaymentEvent(prisma: any, action: string, links: any, event: any) {
  const gcPaymentId = links?.payment;
  if (!gcPaymentId) return;

  const sepaPayment = await prisma.sepaPayment.findUnique({
    where: { gcPaymentId },
  });

  if (!sepaPayment) {
    logger.warn(`[GC Webhook] Payment ${gcPaymentId} not found in local DB`);
    // Actualizar BankTransaction legacy si existe
    await updateLegacyTransaction(prisma, gcPaymentId, action);
    return;
  }

  switch (action) {
    case 'submitted':
      await prisma.sepaPayment.update({
        where: { gcPaymentId },
        data: { status: 'submitted' },
      });
      break;

    case 'confirmed':
      await prisma.sepaPayment.update({
        where: { gcPaymentId },
        data: { status: 'confirmed' },
      });
      // Auto-conciliar si tiene payment vinculado
      if (sepaPayment.inmovaPaymentId && !sepaPayment.conciliado) {
        await prisma.$transaction([
          prisma.sepaPayment.update({
            where: { gcPaymentId },
            data: {
              conciliado: true,
              conciliadoEn: new Date(),
              conciliadoPor: 'webhook_auto',
            },
          }),
          prisma.payment.update({
            where: { id: sepaPayment.inmovaPaymentId },
            data: {
              estado: 'pagado',
              fechaPago: sepaPayment.chargeDate ? new Date(sepaPayment.chargeDate) : new Date(),
              metodoPago: 'sepa_direct_debit',
            },
          }),
        ]);
        logger.info(`[GC Webhook] Auto-reconciled payment ${gcPaymentId}`);
      }
      break;

    case 'paid_out': {
      const payoutId = links?.payout;
      await prisma.sepaPayment.update({
        where: { gcPaymentId },
        data: {
          status: 'paid_out',
          gcPayoutId: payoutId || null,
          payoutDate: new Date(),
        },
      });
      break;
    }

    case 'failed':
    case 'cancelled':
    case 'customer_approval_denied':
      await prisma.sepaPayment.update({
        where: { gcPaymentId },
        data: {
          status: action as any,
          failureReason: event.details?.description || action,
        },
      });
      break;

    case 'charged_back':
      await prisma.sepaPayment.update({
        where: { gcPaymentId },
        data: {
          status: 'charged_back',
          chargeBackDate: new Date(),
          failureReason: 'Devolución solicitada por el pagador',
        },
      });
      // Si estaba conciliado, deshacer conciliación
      if (sepaPayment.conciliado && sepaPayment.inmovaPaymentId) {
        await prisma.payment.update({
          where: { id: sepaPayment.inmovaPaymentId },
          data: { estado: 'pendiente', fechaPago: null, metodoPago: null },
        });
        await prisma.sepaPayment.update({
          where: { gcPaymentId },
          data: {
            conciliado: false,
            conciliadoEn: null,
            notaConciliacion: `Devolución (chargeback) el ${new Date().toISOString()}`,
          },
        });
        logger.warn(`[GC Webhook] Chargeback: undid reconciliation for ${gcPaymentId}`);
      }
      break;
  }
}

async function handleMandateEvent(prisma: any, action: string, links: any, _event: any) {
  const gcMandateId = links?.mandate;
  if (!gcMandateId) return;

  const mandate = await prisma.sepaMandate.findUnique({
    where: { gcMandateId },
  });

  switch (action) {
    case 'active':
      if (mandate) {
        await prisma.sepaMandate.update({
          where: { gcMandateId },
          data: { status: 'active' },
        });
      }
      // Legacy: actualizar BankConnection
      await prisma.bankConnection.updateMany({
        where: { proveedorItemId: gcMandateId, proveedor: 'gocardless' },
        data: { estado: 'conectado' },
      });
      break;

    case 'submitted':
      if (mandate) {
        await prisma.sepaMandate.update({
          where: { gcMandateId },
          data: { status: 'submitted' },
        });
      }
      break;

    case 'cancelled':
    case 'expired':
    case 'failed':
      if (mandate) {
        await prisma.sepaMandate.update({
          where: { gcMandateId },
          data: { status: action as any },
        });
      }
      await prisma.bankConnection.updateMany({
        where: { proveedorItemId: gcMandateId, proveedor: 'gocardless' },
        data: { estado: 'desconectado', desconectadaEn: new Date() },
      });
      break;

    case 'suspended_by_payer':
      if (mandate) {
        await prisma.sepaMandate.update({
          where: { gcMandateId },
          data: { status: 'suspended_by_payer' },
        });
      }
      break;
  }
}

async function handleSubscriptionEvent(prisma: any, action: string, links: any, _event: any) {
  const gcSubscriptionId = links?.subscription;
  if (!gcSubscriptionId) return;

  const sub = await prisma.sepaSubscription.findUnique({
    where: { gcSubscriptionId },
  });

  if (!sub) return;

  switch (action) {
    case 'cancelled':
    case 'finished':
      await prisma.sepaSubscription.update({
        where: { gcSubscriptionId },
        data: { status: action as any },
      });
      break;

    case 'paused':
      await prisma.sepaSubscription.update({
        where: { gcSubscriptionId },
        data: { status: 'paused' },
      });
      break;

    case 'resumed':
      await prisma.sepaSubscription.update({
        where: { gcSubscriptionId },
        data: { status: 'active' },
      });
      break;

    case 'customer_approval_denied':
      await prisma.sepaSubscription.update({
        where: { gcSubscriptionId },
        data: { status: 'customer_approval_denied' },
      });
      break;
  }
}

async function handlePayoutEvent(prisma: any, action: string, links: any, event: any) {
  const gcPayoutId = links?.payout;
  if (!gcPayoutId) return;

  if (action === 'paid') {
    // Actualizar o crear payout local
    const existing = await prisma.gCPayout.findUnique({
      where: { gcPayoutId },
    });

    if (existing) {
      await prisma.gCPayout.update({
        where: { gcPayoutId },
        data: { status: 'paid' },
      });
    }
    // Si no existe, se creará en el próximo sync
    logger.info(`[GC Webhook] Payout ${gcPayoutId} paid`);
  } else if (action === 'bounced') {
    await prisma.gCPayout.updateMany({
      where: { gcPayoutId },
      data: { status: 'bounced' },
    });
    logger.warn(`[GC Webhook] Payout ${gcPayoutId} bounced!`);
  }
}

async function handleRefundEvent(prisma: any, action: string, links: any, _event: any) {
  const gcPaymentId = links?.payment;
  if (!gcPaymentId) return;

  if (action === 'created' || action === 'paid') {
    const refundAmount = _event.details?.amount;
    if (refundAmount) {
      await prisma.sepaPayment.updateMany({
        where: { gcPaymentId },
        data: { amountRefunded: { increment: refundAmount } },
      });
    }
  }
}

/**
 * Compatibilidad: actualizar BankTransaction legacy
 */
async function updateLegacyTransaction(prisma: any, gcPaymentId: string, action: string) {
  try {
    if (action === 'confirmed' || action === 'paid_out') {
      await prisma.bankTransaction.updateMany({
        where: { proveedorTxId: gcPaymentId },
        data: { estado: 'conciliado' },
      });
    } else if (action === 'failed' || action === 'charged_back' || action === 'cancelled') {
      await prisma.bankTransaction.updateMany({
        where: { proveedorTxId: gcPaymentId },
        data: { estado: 'descartado' },
      });
    }
  } catch (e) {
    // Non-critical
  }
}

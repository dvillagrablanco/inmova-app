/**
 * Webhook Dispatcher
 * Envía webhooks a URLs suscritas cuando ocurren eventos
 */

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import crypto from 'crypto';

export type WebhookEventType =
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'PROPERTY_DELETED'
  | 'TENANT_CREATED'
  | 'TENANT_UPDATED'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_RESOLVED'
  | 'DOCUMENT_UPLOADED'
  | 'USER_CREATED';

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: any;
}

/**
 * Disparar webhook para un evento
 */
export async function dispatchWebhook(
  companyId: string,
  event: WebhookEventType,
  data: any
): Promise<void> {
  try {
    // Buscar subscripciones activas para este evento
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        companyId,
        active: true,
        events: {
          has: event,
        },
      },
    });

    if (subscriptions.length === 0) {
      logger.debug(`No webhook subscriptions found for event ${event} in company ${companyId}`);
      return;
    }

    // Enviar a todas las subscripciones
    const deliveryPromises = subscriptions.map((subscription) =>
      sendWebhook(subscription, event, data)
    );

    await Promise.allSettled(deliveryPromises);
  } catch (error) {
    logger.error('Error dispatching webhooks:', error);
  }
}

/**
 * Enviar webhook a una URL específica
 */
async function sendWebhook(subscription: any, event: WebhookEventType, data: any): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Crear registro de delivery
  const delivery = await prisma.webhookDelivery.create({
    data: {
      subscriptionId: subscription.id,
      event,
      payload,
      url: subscription.url,
      method: 'POST',
      attempts: 0,
      maxAttempts: subscription.maxRetries || 3,
    },
  });

  // Enviar (con retry)
  await sendWebhookWithRetry(delivery.id, subscription, payload);
}

/**
 * Enviar webhook con reintentos
 */
async function sendWebhookWithRetry(
  deliveryId: string,
  subscription: any,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<void> {
  const startTime = Date.now();

  try {
    // Firmar payload con HMAC
    const signature = generateWebhookSignature(payload, subscription.secret);

    // Enviar HTTP POST
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inmova-Signature': signature,
        'X-Inmova-Event': payload.event,
        'User-Agent': 'Inmova-Webhooks/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const responseBody = await response.text().catch(() => '');
    const responseTime = Date.now() - startTime;

    // Actualizar delivery
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        statusCode: response.status,
        responseBody: responseBody.substring(0, 1000), // Limitar a 1KB
        responseTime,
        success: response.ok,
        sentAt: new Date(),
        ...(response.ok && { nextRetryAt: null }),
        ...(!response.ok && {
          error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
        }),
      },
    });

    // Actualizar estadísticas de subscription
    if (response.ok) {
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          successCount: { increment: 1 },
          lastSuccessAt: new Date(),
        },
      });

      logger.info(`Webhook sent successfully to ${subscription.url} for event ${payload.event}`);
    } else {
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          failureCount: { increment: 1 },
          lastFailureAt: new Date(),
        },
      });

      // Reintentar si no fue exitoso
      if (attempt < (subscription.maxRetries || 3)) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt), 60000); // Exponential backoff, max 60s

        setTimeout(() => {
          sendWebhookWithRetry(deliveryId, subscription, payload, attempt + 1);
        }, retryDelay);

        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            nextRetryAt: new Date(Date.now() + retryDelay),
          },
        });
      }
    }
  } catch (error: any) {
    logger.error(`Error sending webhook to ${subscription.url}:`, error);

    // Actualizar delivery con error
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        success: false,
        error: error.message || String(error),
        responseTime: Date.now() - startTime,
      },
    });

    // Actualizar estadísticas de subscription
    await prisma.webhookSubscription.update({
      where: { id: subscription.id },
      data: {
        failureCount: { increment: 1 },
        lastFailureAt: new Date(),
      },
    });

    // Reintentar si no alcanzó el máximo
    if (attempt < (subscription.maxRetries || 3)) {
      const retryDelay = Math.min(1000 * Math.pow(2, attempt), 60000);

      setTimeout(() => {
        sendWebhookWithRetry(deliveryId, subscription, payload, attempt + 1);
      }, retryDelay);

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          nextRetryAt: new Date(Date.now() + retryDelay),
        },
      });
    }
  }
}

/**
 * Generar firma HMAC SHA-256 del payload
 */
function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

/**
 * Verificar firma de webhook (para validar requests entrantes si hubiera)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

/**
 * Generar secret aleatorio para webhook
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

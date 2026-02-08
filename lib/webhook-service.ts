/**
 * Servicio de Webhooks para Zero-Touch Onboarding
 * Envía eventos a URLs externas suscritas
 */

import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';

export type WebhookEventType =
  | 'USER_CREATED'
  | 'USER_ONBOARDING_COMPLETED'
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
  | 'DOCUMENT_UPLOADED';

interface CreateWebhookEventOptions {
  companyId: string;
  event: WebhookEventType;
  payload: Record<string, any>;
}

interface WebhookSubscription {
  url: string;
  events: WebhookEventType[];
  secret?: string;
}

/**
 * Crea un nuevo evento de webhook
 */
export async function createWebhookEvent(options: CreateWebhookEventOptions) {
  try {
    const { companyId, event, payload } = options;

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        companyId,
        event,
        payload,
        status: 'pending',
      },
    });

    logger.info(`Evento webhook creado: ${event}`, {
      webhookEventId: webhookEvent.id,
      companyId,
    });

    return webhookEvent;
  } catch (error: any) {
    logger.error('Error creando evento webhook:', error);
    throw error;
  }
}

/**
 * Procesa webhooks pendientes y los envía a las URLs suscritas
 */
export async function processWebhookEvents(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  try {
    // Obtener webhooks pendientes
    const pendingWebhooks = await prisma.webhookEvent.findMany({
      where: {
        status: 'pending',
      },
      take: 50, // Procesar máximo 50 por ejecución
      include: {
        company: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const webhook of pendingWebhooks) {
      try {
        // Obtener suscripciones de webhook para esta compañía
        const subscriptions = await getWebhookSubscriptions(webhook.companyId, webhook.event as WebhookEventType);

        if (subscriptions.length === 0) {
          // No hay suscripciones, marcar como completado sin envío
          await prisma.webhookEvent.update({
            where: { id: webhook.id },
            data: {
              status: 'no_subscribers',
              sentAt: new Date(),
            },
          });
          sent++;
          continue;
        }

        // Enviar a cada suscripción
        let allSuccessful = true;
        const responses = [];

        for (const subscription of subscriptions) {
          const result = await sendWebhook({
            url: subscription.url,
            event: webhook.event as WebhookEventType,
            payload: webhook.payload as Record<string, any>,
            secret: subscription.secret,
          });

          responses.push({
            url: subscription.url,
            success: result.success,
            statusCode: result.statusCode,
            error: result.error,
          });

          if (!result.success) {
            allSuccessful = false;
          }
        }

        // Actualizar estado del webhook
        if (allSuccessful) {
          await prisma.webhookEvent.update({
            where: { id: webhook.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              response: responses,
            },
          });
          sent++;
        } else {
          // Incrementar intentos y marcar como fallido si excede 3 intentos
          const attempts = (webhook.attempts || 0) + 1;
          const status = attempts >= 3 ? 'failed' : 'pending';

          await prisma.webhookEvent.update({
            where: { id: webhook.id },
            data: {
              status,
              attempts,
              response: responses,
            },
          });

          if (status === 'failed') {
            failed++;
          }
        }
      } catch (error: any) {
        logger.error(`Error procesando webhook ${webhook.id}:`, error);

        // Marcar como failed
        await prisma.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            status: 'failed',
            error: error.message,
          },
        });
        failed++;
      }
    }

    logger.info(`Webhooks procesados: ${pendingWebhooks.length}`, {
      sent,
      failed,
    });

    return {
      processed: pendingWebhooks.length,
      sent,
      failed,
    };
  } catch (error: any) {
    logger.error('Error en processWebhookEvents:', error);
    throw error;
  }
}

/**
 * Envía un webhook a una URL específica
 */
async function sendWebhook(options: {
  url: string;
  event: WebhookEventType;
  payload: Record<string, any>;
  secret?: string;
}): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
}> {
  try {
    const { url, event, payload, secret } = options;

    // Preparar body
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'INMOVA-Webhooks/1.0',
    };

    // Agregar firma HMAC si hay secret
    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      headers['X-INMOVA-Signature'] = signature;
    }

    // Enviar request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
    });

    if (response.ok) {
      logger.info(`Webhook enviado exitosamente: ${event} -> ${url}`);
      return {
        success: true,
        statusCode: response.status,
      };
    } else {
      const errorText = await response.text();
      logger.warn(`Webhook falló: ${event} -> ${url}`, {
        statusCode: response.status,
        error: errorText,
      });
      return {
        success: false,
        statusCode: response.status,
        error: errorText,
      };
    }
  } catch (error: any) {
    logger.error('Error enviando webhook:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtiene las suscripciones de webhook para un evento específico
 * (En esta implementación, las suscripciones están hardcoded o en variables de entorno)
 */
async function getWebhookSubscriptions(
  companyId: string,
  event: WebhookEventType
): Promise<WebhookSubscription[]> {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      companyId,
      active: true,
      events: {
        has: event,
      },
    },
    select: {
      url: true,
      events: true,
      secret: true,
    },
  });

  return subscriptions.map((subscription) => ({
    url: subscription.url,
    events: subscription.events as WebhookEventType[],
    secret: subscription.secret,
  }));
}

/**
 * Registra una suscripción de webhook (para futuras mejoras)
 */
export async function registerWebhookSubscription(
  companyId: string,
  createdBy: string,
  url: string,
  events: WebhookEventType[],
  secret?: string
): Promise<string> {
  const webhookSecret = secret || crypto.randomBytes(32).toString('hex');
  await prisma.webhookSubscription.create({
    data: {
      companyId,
      url,
      events: events as any,
      secret: webhookSecret,
      createdBy,
    },
  });
  logger.info(`Suscripción webhook registrada: ${url}`, { companyId, events });
  return webhookSecret;
}

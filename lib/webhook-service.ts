/**
 * Servicio de Webhooks para Zero-Touch Onboarding
 * Envía eventos a URLs externas suscritas
 */

import { prisma } from './db';
import logger from './logger';

export type WebhookEventType =
  | 'user.created'
  | 'user.onboarding_completed'
  | 'building.created'
  | 'contract.created'
  | 'payment.received'
  | 'task.completed'
  | 'maintenance.created';

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
        const subscriptions = await getWebhookSubscriptions(
          webhook.companyId,
          webhook.event as WebhookEventType
        );

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
      const crypto = require('crypto');
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
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
  // DEMO: Retornar suscripciones desde variables de entorno
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const webhookEvents = process.env.WEBHOOK_EVENTS?.split(',') || [];

  if (!webhookUrl) {
    return [];
  }

  // Verificar si este evento está suscrito
  const isSubscribed = webhookEvents.includes('*') || webhookEvents.includes(event);

  if (!isSubscribed) {
    return [];
  }

  return [
    {
      url: webhookUrl,
      events: webhookEvents as WebhookEventType[],
      secret: webhookSecret,
    },
  ];
}

/**
 * Registra una suscripción de webhook (para futuras mejoras)
 */
export async function registerWebhookSubscription(
  companyId: string,
  url: string,
  events: WebhookEventType[],
  secret?: string
): Promise<void> {
  // TODO: Implementar guardado en base de datos
  // Por ahora, esta función es un placeholder
  logger.info(`Suscripción webhook registrada: ${url}`, {
    companyId,
    events,
  });
}

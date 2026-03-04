/**
 * Slack Integration
 * Send notifications to Slack channels
 */

import logger from '@/lib/logger';

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: any[];
}

/**
 * Enviar notificación a Slack via Webhook
 */
export async function sendSlackNotification(message: SlackMessage): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('[Slack] Webhook URL not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}`);
    }

    // Notification sent successfully
  } catch (error) {
    logger.error('[Slack] Error sending notification:', error);
  }
}

/**
 * Notificar nueva propiedad creada
 */
export async function notifyPropertyCreated(property: any, companyName: string): Promise<void> {
  await sendSlackNotification({
    text: `🏠 Nueva propiedad creada`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🏠 Nueva Propiedad Creada*\n\n*Empresa:* ${companyName}\n*Dirección:* ${property.address}\n*Ciudad:* ${property.city}\n*Precio:* ${property.price}€/mes`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `ID: ${property.id} | Creada: ${new Date(property.createdAt).toLocaleString('es-ES')}`,
          },
        ],
      },
    ],
  });
}

/**
 * Notificar nuevo contrato firmado
 */
export async function notifyContractSigned(contract: any, companyName: string): Promise<void> {
  await sendSlackNotification({
    text: `✍️ Contrato firmado`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✍️ Contrato Firmado*\n\n*Empresa:* ${companyName}\n*Propiedad:* ${contract.property?.address || 'N/A'}\n*Inquilino:* ${contract.tenant?.name || 'N/A'}\n*Renta:* ${contract.rentAmount}€/mes`,
        },
      },
    ],
  });
}

/**
 * Notificar pago recibido
 */
export async function notifyPaymentReceived(payment: any, companyName: string): Promise<void> {
  await sendSlackNotification({
    text: `💰 Pago recibido`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💰 Pago Recibido*\n\n*Empresa:* ${companyName}\n*Monto:* ${payment.amount}€\n*Concepto:* ${payment.concept || 'Alquiler'}\n*Estado:* ${payment.status}`,
        },
      },
    ],
  });
}

/**
 * Notificar incidencia de mantenimiento
 */
export async function notifyMaintenanceRequest(request: any, companyName: string): Promise<void> {
  const urgencyEmoji =
    request.urgency === 'HIGH' ? '🚨' : request.urgency === 'MEDIUM' ? '⚠️' : 'ℹ️';

  await sendSlackNotification({
    text: `${urgencyEmoji} Nueva incidencia de mantenimiento`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${urgencyEmoji} Nueva Incidencia de Mantenimiento*\n\n*Empresa:* ${companyName}\n*Propiedad:* ${request.property?.address || 'N/A'}\n*Urgencia:* ${request.urgency}\n*Descripción:* ${request.description}`,
        },
      },
    ],
  });
}

/**
 * Notificar error crítico en la aplicación
 */
export async function notifyCriticalError(
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  await sendSlackNotification({
    text: `🚨 Error crítico en Inmova`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚨 Error Crítico*\n\n*Mensaje:* ${error.message}\n*Stack:* \`\`\`${error.stack?.substring(0, 500) || 'N/A'}\`\`\``,
        },
      },
      ...(context
        ? [
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Context: ${JSON.stringify(context, null, 2).substring(0, 200)}`,
                },
              ],
            },
          ]
        : []),
    ],
  });
}

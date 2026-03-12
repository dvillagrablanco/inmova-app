// @ts-nocheck
/**
 * Servicio de Notificaciones Push Web
 *
 * Maneja suscripciones y envío de notificaciones push usando Web Push API.
 *
 * @module PushNotificationService
 */

import webpush from 'web-push';
import { prisma } from './db';
import logger from './logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

// Configurar VAPID keys (generar con: npx web-push generate-vapid-keys)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.SMTP_FROM || 'support@inmovaapp.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================================================
// TIPOS
// ============================================================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  url?: string;
}

export type NotificationType =
  | 'NEW_MATCH' // Nuevo match inquilino-propiedad
  | 'INCIDENT_UPDATE' // Actualización de incidencia
  | 'PAYMENT_DUE' // Pago próximo
  | 'CONTRACT_EXPIRING' // Contrato expirando
  | 'NEW_MESSAGE' // Nuevo mensaje
  | 'PROPERTY_VIEWED' // Propiedad visitada
  | 'GENERAL'; // General

// ============================================================================
// SUSCRIPCIONES
// ============================================================================

/**
 * Guarda una nueva suscripción push
 */
export async function savePushSubscription(
  userId: string,
  companyId: string,
  subscription: PushSubscription
): Promise<any> {
  try {
    const sub = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        active: true,
      },
      create: {
        userId,
        companyId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        active: true,
      },
    });

    logger.info('✅ Push subscription saved', { userId, endpoint: subscription.endpoint });

    return sub;
  } catch (error: any) {
    logger.error('❌ Error saving push subscription:', error);
    throw new Error(`Failed to save subscription: ${error.message}`);
  }
}

/**
 * Obtiene todas las suscripciones activas de un usuario
 */
export async function getUserSubscriptions(userId: string): Promise<any[]> {
  try {
    return await prisma.pushSubscription.findMany({
      where: {
        userId,
        active: true,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error getting user subscriptions:', error);
    return [];
  }
}

/**
 * Desactiva una suscripción
 */
export async function unsubscribe(userId: string, endpoint: string): Promise<boolean> {
  try {
    await prisma.pushSubscription.update({
      where: {
        userId_endpoint: {
          userId,
          endpoint,
        },
      },
      data: {
        active: false,
      },
    });

    logger.info('🔕 Push subscription deactivated', { userId, endpoint });
    return true;
  } catch (error: any) {
    logger.error('❌ Error unsubscribing:', error);
    return false;
  }
}

// ============================================================================
// ENVÍO DE NOTIFICACIONES
// ============================================================================

/**
 * Envía notificación push a un usuario específico
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
  type: NotificationType = 'GENERAL'
): Promise<{ sent: number; failed: number }> {
  try {
    // Obtener suscripciones del usuario
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      logger.warn('⚠️ No push subscriptions found for user', { userId });
      return { sent: 0, failed: 0 };
    }

    // Enviar a todas las suscripciones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              ...payload,
              type,
              timestamp: new Date().toISOString(),
            })
          );

          // Registrar notificación enviada
          await prisma.pushNotificationLog.create({
            data: {
              userId,
              subscriptionId: sub.id,
              type,
              title: payload.title,
              body: payload.body,
              status: 'SENT',
            },
          });

          logger.debug('✅ Push notification sent', { userId, endpoint: sub.endpoint });
          return { success: true };
        } catch (error: any) {
          // Manejar errores (ej: suscripción expirada)
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Desactivar suscripción expirada
            await unsubscribe(userId, sub.endpoint);
          }

          // Registrar error
          await prisma.pushNotificationLog.create({
            data: {
              userId,
              subscriptionId: sub.id,
              type,
              title: payload.title,
              body: payload.body,
              status: 'FAILED',
              errorMessage: error.message,
            },
          });

          logger.warn('⚠️ Push notification failed', {
            userId,
            endpoint: sub.endpoint,
            error: error.message,
          });
          return { success: false };
        }
      })
    );

    // Contar resultados
    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;

    logger.info(`📨 Push notifications sent: ${sent}/${results.length}`, { userId });

    return { sent, failed };
  } catch (error: any) {
    logger.error('❌ Error sending push notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envía notificación push a múltiples usuarios
 */
export async function sendPushNotificationToMany(
  userIds: string[],
  payload: NotificationPayload,
  type: NotificationType = 'GENERAL'
): Promise<{ sent: number; failed: number }> {
  try {
    const results = await Promise.all(
      userIds.map((userId) => sendPushNotification(userId, payload, type))
    );

    const totals = results.reduce(
      (acc, result) => ({
        sent: acc.sent + result.sent,
        failed: acc.failed + result.failed,
      }),
      { sent: 0, failed: 0 }
    );

    logger.info(`📨 Batch push notifications sent: ${totals.sent} sent, ${totals.failed} failed`);

    return totals;
  } catch (error: any) {
    logger.error('❌ Error sending batch push notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

// ============================================================================
// NOTIFICACIONES ESPECÍFICAS
// ============================================================================

/**
 * Notifica nuevo match a un inquilino
 */
export async function notifyNewMatch(
  tenantId: string,
  matchScore: number,
  propertyAddress: string
): Promise<void> {
  await sendPushNotification(
    tenantId,
    {
      title: '🏠 Nuevo Match Encontrado!',
      body: `Encontramos una propiedad perfecta para ti (${matchScore}% match): ${propertyAddress}`,
      icon: '/icons/match-icon.png',
      url: '/dashboard/matches',
      actions: [
        { action: 'view', title: 'Ver Detalles' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    },
    'NEW_MATCH'
  );
}

/**
 * Notifica actualización de incidencia
 */
export async function notifyIncidentUpdate(
  userId: string,
  incidentTitle: string,
  newStatus: string
): Promise<void> {
  await sendPushNotification(
    userId,
    {
      title: '🔧 Actualización de Incidencia',
      body: `"${incidentTitle}" ahora está en estado: ${newStatus}`,
      icon: '/icons/maintenance-icon.png',
      url: '/dashboard/maintenance',
    },
    'INCIDENT_UPDATE'
  );
}

/**
 * Notifica pago próximo
 */
export async function notifyPaymentDue(
  tenantId: string,
  amount: number,
  dueDate: Date
): Promise<void> {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  await sendPushNotification(
    tenantId,
    {
      title: '💰 Pago Próximo',
      body: `Tienes un pago de €${amount} en ${daysUntilDue} días`,
      icon: '/icons/payment-icon.png',
      url: '/pagos',
      actions: [
        { action: 'pay', title: 'Pagar Ahora' },
        { action: 'remind', title: 'Recordar Después' },
      ],
    },
    'PAYMENT_DUE'
  );
}

/**
 * Notifica contrato expirando
 */
export async function notifyContractExpiring(
  userId: string,
  propertyAddress: string,
  daysUntilExpiry: number
): Promise<void> {
  await sendPushNotification(
    userId,
    {
      title: '📄 Contrato Expirando',
      body: `El contrato de ${propertyAddress} expira en ${daysUntilExpiry} días`,
      icon: '/icons/contract-icon.png',
      url: '/dashboard/contracts',
    },
    'CONTRACT_EXPIRING'
  );
}

export default {
  savePushSubscription,
  getUserSubscriptions,
  unsubscribe,
  sendPushNotification,
  sendPushNotificationToMany,
  notifyNewMatch,
  notifyIncidentUpdate,
  notifyPaymentDue,
  notifyContractExpiring,
};

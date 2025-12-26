/**
 * Servicio de Notificaciones Push
 * Implementa web push notifications usando web-push
 */

import webpush from 'web-push';
import { prisma } from './db';
import logger from './logger';

// Configurar VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails('mailto:admin@inmova.app', vapidKeys.publicKey, vapidKeys.privateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Envía una notificación push a un usuario
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener suscripciones del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
      },
    });

    if (subscriptions.length === 0) {
      logger.info('Usuario sin suscripciones push', { userId });
      return { success: false, error: 'Usuario sin suscripciones' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscriptionObject = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(subscriptionObject, JSON.stringify(payload));

          logger.info('Push notification enviada', {
            userId,
            subscriptionId: sub.id,
          });
        } catch (error: any) {
          // Si la suscripción expiró o es inválida, eliminarla
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            logger.info('Suscripción push eliminada (inválida)', { subscriptionId: sub.id });
          }
          throw error;
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    logger.info('Resultados de envío push', {
      userId,
      success: successCount,
      failed: failureCount,
    });

    return {
      success: successCount > 0,
      error: failureCount > 0 ? `${failureCount} suscripciones fallaron` : undefined,
    };
  } catch (error) {
    logger.error('Error enviando push notification', { error });
    return { success: false, error: 'Error enviando notificación' };
  }
}

/**
 * Envía notificaciones push a múltiples usuarios
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Suscribe a un usuario a las notificaciones push
 */
export async function subscribePushNotification(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
): Promise<{ success: boolean; subscriptionId?: string }> {
  try {
    // Verificar si ya existe esta suscripción
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      // Reactivar si estaba inactiva
      // Subscription already exists and is active
      return { success: true, subscriptionId: existing.id };
    }

    // Crear nueva suscripción
    const newSub = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    logger.info('Usuario suscrito a push notifications', {
      userId,
      subscriptionId: newSub.id,
    });

    return { success: true, subscriptionId: newSub.id };
  } catch (error) {
    logger.error('Error suscribiendo a push notifications', { error });
    return { success: false };
  }
}

/**
 * Desuscribe a un usuario de las notificaciones push
 */
export async function unsubscribePushNotification(
  userId: string,
  endpoint: string
): Promise<{ success: boolean }> {
  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

    logger.info('Usuario desuscrito de push notifications', { userId, endpoint });
    return { success: true };
  } catch (error) {
    logger.error('Error desuscribiendo de push notifications', { error });
    return { success: false };
  }
}

/**
 * Genera VAPID keys (solo usar una vez para configuración inicial)
 */
export function generateVapidKeys() {
  const keys = webpush.generateVAPIDKeys();
  console.log('VAPID Keys generadas:');
  console.log('Public Key:', keys.publicKey);
  console.log('Private Key:', keys.privateKey);
  return keys;
}

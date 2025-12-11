/**
 * Servicio para gestionar notificaciones push
 */

import webpush from 'web-push';
import { prisma } from './db';
import logger from './logger';

// Configurar web-push con las claves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@inmova.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  logger.warn('VAPID keys no configuradas. Las notificaciones push no funcionarán.');
}

// ============================================================================
// TIPOS
// ============================================================================
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  metadata?: Record<string, any>;
}

// ============================================================================
// FUNCIONES
// ============================================================================

/**
 * Envía una notificación push a un usuario específico
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotificationPayload
): Promise<boolean> {
  try {
    // Obtener todas las suscripciones del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId
      }
    });

    if (subscriptions.length === 0) {
      logger.info(`No push subscriptions found for user ${userId}`);
      return false;
    }

    // Preparar el payload
    const payload = JSON.stringify(notification);

    // Enviar a todas las suscripciones del usuario
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Reconstruir el objeto de suscripción en el formato esperado por web-push
          const subscriptionObject = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          await webpush.sendNotification(
            subscriptionObject as any,
            payload
          );
          logger.info(`Push sent to subscription ${sub.id}`);
          return true;
        } catch (error: any) {
          logger.error(`Error sending push to subscription ${sub.id}:`, error);

          // Si la suscripción es inválida (410 Gone), eliminarla
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id }
            });
            logger.info(`Subscription ${sub.id} deleted (invalid)`);
          }

          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    return successful > 0;
  } catch (error) {
    logger.error(`Error in sendPushNotification for user ${userId}:`, error);
    return false;
  }
}

/**
 * Envía notificaciones push a múltiples usuarios
 */
export async function sendPushNotificationToMany(
  userIds: string[],
  notification: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, notification))
  );

  const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;

  logger.info(`Bulk push notifications: ${sent} sent, ${failed} failed`);

  return { sent, failed };
}

/**
 * Envía una notificación push a todos los usuarios de una compañía
 */
export async function sendPushNotificationToCompany(
  companyId: string,
  notification: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    // Obtener todos los usuarios de la compañía
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true }
    });

    const userIds = users.map(u => u.id);
    return await sendPushNotificationToMany(userIds, notification);
  } catch (error) {
    logger.error(`Error in sendPushNotificationToCompany:`, error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Limpia suscripciones antiguas (por fecha de actualización)
 */
export async function cleanupOldSubscriptions(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        updatedAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${result.count} old push subscriptions`);
    return result.count;
  } catch (error) {
    logger.error('Error cleaning up subscriptions:', error);
    return 0;
  }
}

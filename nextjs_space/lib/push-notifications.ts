import { prisma } from './db';

// Nota: Esta es una implementación simplificada
// En producción, usar web-push library para enviar notificaciones reales
// npm install web-push
// import webpush from 'web-push';

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendPushNotification(
  userId: string,
  notification: PushNotificationData
) {
  try {
    // Obtener todas las suscripciones del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return {
        success: false,
        message: 'Usuario no tiene suscripciones activas',
        sent: 0,
      };
    }

    // En producción, usar web-push para enviar notificaciones:
    /*
    const vapidDetails = {
      subject: 'mailto:admin@inmova.com',
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    };

    webpush.setVapidDetails(
      vapidDetails.subject,
      vapidDetails.publicKey,
      vapidDetails.privateKey
    );

    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: JSON.parse(sub.keys),
      };

      return webpush
        .sendNotification(pushSubscription, JSON.stringify(notification))
        .catch((error) => {
          console.error('Error sending push notification:', error);
          // Si la suscripción es inválida, eliminarla
          if (error.statusCode === 410) {
            return prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
          }
        });
    });

    await Promise.all(promises);
    */

    // Por ahora, solo simulamos el envío
    console.log('Push notification would be sent:', {
      userId,
      notification,
      subscriptions: subscriptions.length,
    });

    return {
      success: true,
      message: 'Notificaciones enviadas exitosamente',
      sent: subscriptions.length,
    };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    throw new Error(error.message || 'Error al enviar notificación push');
  }
}

export async function getUserSubscriptions(userId: string) {
  return await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteSubscription(subscriptionId: string) {
  return await prisma.pushSubscription.delete({
    where: { id: subscriptionId },
  });
}

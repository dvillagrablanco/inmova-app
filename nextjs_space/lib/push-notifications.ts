/**
 * Sistema de Notificaciones Push con Web Push API
 * Implementación completa para INMOVA
 */

import webpush from 'web-push';
import { prisma } from './db';

// Configuración de VAPID keys
// Para generar keys nuevas: `npx web-push generate-vapid-keys`
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BF8XFsz_Pg8xAJ_Jl0lnP2YVZ5dBj3QjQo8FZk7VmN9cQWzD_kN4xQjJlL8mP2yVZ5dBj3QjQo8FZk7VmN9cQ',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'o8FZk7VmN9cQWzD_kN4xQjJlL8mP2yVZ5dBj3QjQo8FZk7VmN9cQWzD'
};

// Configurar web-push con las credenciales VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:soporte@inmova.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushSubscriptionInfo {
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
  tag?: string;
  data?: any;
  url?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Guarda una suscripción push en la base de datos
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionInfo
): Promise<any> {
  try {
    // Verificar si ya existe una suscripción para este endpoint
    const existingSub = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: subscription.endpoint
      }
    });

    if (existingSub) {
      // Actualizar usuario si cambió
      return await prisma.pushSubscription.update({
        where: { id: existingSub.id },
        data: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date()
        }
      });
    }

    // Crear nueva suscripción
    return await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

/**
 * Elimina una suscripción push
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint }
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    throw error;
  }
}

/**
 * Obtiene todas las suscripciones de un usuario
 */
export async function getUserSubscriptions(userId: string): Promise<any[]> {
  try {
    return await prisma.pushSubscription.findMany({
      where: { userId }
    });
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
}

/**
 * Envía una notificación push a un usuario específico
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    const subscriptions = await getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        return sendPushNotification(pushSubscription, payload);
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Eliminar suscripciones inválidas
    const failedIndices = results
      .map((r, i) => r.status === 'rejected' ? i : -1)
      .filter(i => i >= 0);

    for (const index of failedIndices) {
      await removePushSubscription(subscriptions[index].endpoint);
    }

    return { success, failed };
  } catch (error) {
    console.error('Error sending push to user:', error);
    return { success: 0, failed: 1 };
  }
}

/**
 * Envía una notificación push a múltiples usuarios
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotificationToUser(userId, payload))
  );

  const totalSuccess = results
    .filter(r => r.status === 'fulfilled')
    .reduce((sum, r: any) => sum + r.value.success, 0);

  const totalFailed = results
    .filter(r => r.status === 'fulfilled')
    .reduce((sum, r: any) => sum + r.value.failed, 0);

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * Envía una notificación push a todos los usuarios de una empresa
 */
export async function sendPushNotificationToCompany(
  companyId: string,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    // Obtener todos los usuarios de la empresa
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true }
    });

    const userIds = users.map(u => u.id);
    return await sendPushNotificationToUsers(userIds, payload);
  } catch (error) {
    console.error('Error sending push to company:', error);
    return { success: 0, failed: 1 };
  }
}

/**
 * Envía una notificación push genérica
 */
async function sendPushNotification(
  subscription: PushSubscriptionInfo,
  payload: NotificationPayload
): Promise<void> {
  const notificationPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/inmova-logo-icon.jpg',
    badge: payload.badge || '/inmova-logo-icon.jpg',
    tag: payload.tag || 'inmova-notification',
    data: {
      ...payload.data,
      url: payload.url || '/dashboard',
      dateOfArrival: Date.now()
    },
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  await webpush.sendNotification(
    subscription as any,
    JSON.stringify(notificationPayload)
  );
}

/**
 * Envía notificación de nuevo pago
 */
export async function sendPaymentNotification(
  userId: string,
  paymentData: {
    amount: number;
    tenantName: string;
    propertyName: string;
    date: Date;
  }
): Promise<void> {
  const payload: NotificationPayload = {
    title: '💵 Nuevo Pago Recibido',
    body: `${paymentData.tenantName} ha pagado €${paymentData.amount.toFixed(2)} por ${paymentData.propertyName}`,
    url: '/pagos',
    tag: 'payment-notification',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver Pago' },
      { action: 'close', title: 'Cerrar' }
    ],
    data: paymentData
  };

  await sendPushNotificationToUser(userId, payload);
}

/**
 * Envía notificación de nueva incidencia
 */
export async function sendMaintenanceNotification(
  userId: string,
  maintenanceData: {
    title: string;
    propertyName: string;
    priority: string;
  }
): Promise<void> {
  const priorityEmoji = {
    'alta': '🔴',
    'media': '🟡',
    'baja': '🟢'
  }[maintenanceData.priority.toLowerCase()] || '🔵';

  const payload: NotificationPayload = {
    title: `${priorityEmoji} Nueva Incidencia de Mantenimiento`,
    body: `${maintenanceData.title} en ${maintenanceData.propertyName}`,
    url: '/mantenimiento',
    tag: 'maintenance-notification',
    requireInteraction: maintenanceData.priority.toLowerCase() === 'alta',
    actions: [
      { action: 'view', title: 'Ver Incidencia' },
      { action: 'close', title: 'Cerrar' }
    ],
    data: maintenanceData
  };

  await sendPushNotificationToUser(userId, payload);
}

/**
 * Envía notificación de vencimiento de contrato
 */
export async function sendContractExpiryNotification(
  userId: string,
  contractData: {
    tenantName: string;
    propertyName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }
): Promise<void> {
  const payload: NotificationPayload = {
    title: '⏰ Contrato Próximo a Vencer',
    body: `El contrato de ${contractData.tenantName} en ${contractData.propertyName} vence en ${contractData.daysUntilExpiry} días`,
    url: '/contratos',
    tag: 'contract-expiry',
    requireInteraction: contractData.daysUntilExpiry <= 7,
    actions: [
      { action: 'view', title: 'Ver Contrato' },
      { action: 'close', title: 'Cerrar' }
    ],
    data: contractData
  };

  await sendPushNotificationToUser(userId, payload);
}

/**
 * Obtiene la clave pública VAPID para el cliente
 */
export function getPublicVapidKey(): string {
  return vapidKeys.publicKey;
}

/**
 * Verifica si las notificaciones push están configuradas
 */
export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

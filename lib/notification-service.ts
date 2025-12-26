/**
 * NOTIFICATION SERVICE
 * Servicio para gestionar notificaciones in-app
 *
 * Funciones:
 * - createNotification: Crear una notificación para un usuario
 * - getUnreadCount: Obtener el número de notificaciones no leídas
 * - markAsRead: Marcar una notificación como leída
 * - markAllAsRead: Marcar todas las notificaciones como leídas
 * - getRecentNotifications: Obtener las notificaciones más recientes
 */

import { prisma } from '@/lib/db';

export type NotificationType = 'success' | 'info' | 'warning' | 'action';

export interface CreateNotificationParams {
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  actionRoute?: string;
}

/**
 * Crea una nueva notificación in-app
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.inAppNotification.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        type: params.type,
        title: params.title,
        message: params.message,
        icon: params.icon || getDefaultIcon(params.type),
        actionLabel: params.actionLabel,
        actionRoute: params.actionRoute,
        read: false,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Obtiene el número de notificaciones no leídas de un usuario
 */
export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.inAppNotification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.inAppNotification.update({
      where: {
        id: notificationId,
        userId, // Asegurar que el usuario solo pueda marcar sus propias notificaciones
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('[NotificationService] Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.inAppNotification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('[NotificationService] Error marking all as read:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

/**
 * Obtiene las notificaciones más recientes de un usuario
 */
export async function getRecentNotifications(userId: string, limit: number = 20) {
  try {
    const notifications = await prisma.inAppNotification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('[NotificationService] Error getting notifications:', error);
    return { success: false, notifications: [] };
  }
}

/**
 * Elimina notificaciones antiguas (más de 30 días)
 */
export async function cleanOldNotifications(userId?: string) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.inAppNotification.deleteMany({
      where: {
        ...(userId && { userId }),
        read: true,
        readAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('[NotificationService] Error cleaning old notifications:', error);
    return { success: false, error: 'Failed to clean old notifications' };
  }
}

// ============================================================================
// NOTIFICACIONES PREDEFINIDAS PARA ONBOARDING
// ============================================================================

/**
 * Crea una notificación de bienvenida
 */
export async function notifyWelcome(userId: string, companyId: string) {
  return createNotification({
    userId,
    companyId,
    type: 'success',
    title: '¡Bienvenido a INMOVA! 🎉',
    message:
      'Tu cuenta ha sido creada exitosamente. Completa tu perfil y comienza a gestionar tus propiedades.',
    icon: 'PartyPopper',
    actionLabel: 'Ir al Onboarding',
    actionRoute: '/onboarding',
  });
}

/**
 * Crea una notificación cuando se completa el onboarding
 */
export async function notifyOnboardingCompleted(userId: string, companyId: string) {
  return createNotification({
    userId,
    companyId,
    type: 'success',
    title: '¡Onboarding Completado! 🚀',
    message:
      'Has completado todas las tareas de configuración inicial. ¡Ahora estás listo para aprovechar todo el potencial de INMOVA!',
    icon: 'CheckCircle2',
    actionLabel: 'Ir al Dashboard',
    actionRoute: '/home',
  });
}

/**
 * Crea una notificación cuando se crea el primer edificio
 */
export async function notifyFirstBuilding(userId: string, companyId: string, buildingName: string) {
  return createNotification({
    userId,
    companyId,
    type: 'success',
    title: '¡Primer Edificio Creado! 🏢',
    message: `Has creado tu primer edificio: "${buildingName}". Ahora puedes añadir unidades y comenzar a gestionar tus propiedades.`,
    icon: 'Building2',
    actionLabel: 'Ver Edificio',
    actionRoute: '/buildings',
  });
}

/**
 * Crea una notificación cuando se crea la primera unidad
 */
export async function notifyFirstUnit(userId: string, companyId: string) {
  return createNotification({
    userId,
    companyId,
    type: 'success',
    title: '¡Primera Unidad Creada! 🏠',
    message:
      'Has añadido tu primera unidad. Ahora puedes crear contratos y comenzar a gestionar inquilinos.',
    icon: 'Home',
    actionLabel: 'Ver Unidades',
    actionRoute: '/units',
  });
}

/**
 * Crea una notificación cuando se crea el primer contrato
 */
export async function notifyFirstContract(userId: string, companyId: string) {
  return createNotification({
    userId,
    companyId,
    type: 'success',
    title: '¡Primer Contrato Creado! 📝',
    message:
      'Has creado tu primer contrato. INMOVA se encargará de gestionar los pagos y notificaciones automáticamente.',
    icon: 'FileText',
    actionLabel: 'Ver Contratos',
    actionRoute: '/contracts',
  });
}

/**
 * Crea una notificación de recordatorio de onboarding
 */
export async function notifyOnboardingReminder(
  userId: string,
  companyId: string,
  progress: number
) {
  return createNotification({
    userId,
    companyId,
    type: 'info',
    title: 'Recordatorio: Completa tu Onboarding ⏰',
    message: `Has completado el ${progress}% del onboarding. Completa el resto para aprovechar todas las funcionalidades de INMOVA.`,
    icon: 'Clock',
    actionLabel: 'Continuar Onboarding',
    actionRoute: '/onboarding',
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene el icono por defecto según el tipo de notificación
 */
function getDefaultIcon(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'CheckCircle2';
    case 'info':
      return 'Info';
    case 'warning':
      return 'AlertTriangle';
    case 'action':
      return 'Bell';
    default:
      return 'Bell';
  }
}

// Stub function for missing export (to be implemented)
export async function cleanupExpiredNotifications() {
  // TODO: Implement cleanup of expired notifications
  return { deleted: 0 };
}

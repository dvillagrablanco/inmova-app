// @ts-nocheck
/**
 * CELEBRATION SERVICE
 * Servicio para gestionar celebraciones de logros del usuario
 *
 * Funcionalidades:
 * - Crear celebraciones cuando se completan hitos
 * - Obtener celebraciones pendientes
 * - Marcar celebraciones como mostradas
 * - Tipos predefinidos de celebraciones
 */

import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export type CelebrationType =
  | 'onboarding_completed'
  | 'first_building'
  | 'first_unit'
  | 'first_contract'
  | 'first_payment'
  | 'milestone_10_properties'
  | 'milestone_50_properties'
  | 'milestone_100_contracts'
  | 'power_user'
  | 'champion';

export interface CreateCelebrationParams {
  userId: string;
  companyId: string;
  type: CelebrationType;
  title: string;
  message: string;
  badgeText?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionRoute?: string;
}

/**
 * Crea una nueva celebración
 */
export async function createCelebration(params: CreateCelebrationParams) {
  try {
    const celebration = await prisma.userCelebration.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        type: params.type,
        title: params.title,
        message: params.message,
        badgeText: params.badgeText,
        badgeColor: params.badgeColor,
        actionLabel: params.actionLabel,
        actionRoute: params.actionRoute,
        shown: false,
      },
    });

    return { success: true, celebration };
  } catch (error) {
    logger.error('[CelebrationService] Error creating celebration:', error);
    return { success: false, error: 'Failed to create celebration' };
  }
}

/**
 * Obtiene celebraciones pendientes (no mostradas) de un usuario
 */
export async function getPendingCelebrations(userId: string) {
  try {
    const celebrations = await prisma.userCelebration.findMany({
      where: {
        userId,
        shown: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return { success: true, celebrations };
  } catch (error) {
    logger.error('[CelebrationService] Error getting celebrations:', error);
    return { success: false, celebrations: [] };
  }
}

/**
 * Marca una celebración como mostrada
 */
export async function markCelebrationAsShown(celebrationId: string, userId: string) {
  try {
    const celebration = await prisma.userCelebration.update({
      where: {
        id: celebrationId,
        userId, // Asegurar que el usuario solo pueda marcar sus propias celebraciones
      },
      data: {
        shown: true,
        shownAt: new Date(),
      },
    });

    return { success: true, celebration };
  } catch (error) {
    logger.error('[CelebrationService] Error marking celebration:', error);
    return { success: false, error: 'Failed to mark celebration' };
  }
}

// ============================================================================
// CELEBRACIONES PREDEFINIDAS
// ============================================================================

/**
 * Celebración por completar el onboarding
 */
export async function celebrateOnboardingCompleted(userId: string, companyId: string) {
  return createCelebration({
    userId,
    companyId,
    type: 'onboarding_completed',
    title: '¡Onboarding Completado! 🎉',
    message:
      'Has completado la configuración inicial de INMOVA. Ahora tienes acceso completo a todas las funcionalidades. ¡Es hora de gestionar tus propiedades como un profesional!',
    badgeText: 'Nivel 1 Desbloqueado',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    actionLabel: 'Ir al Dashboard',
    actionRoute: '/home',
  });
}

/**
 * Celebración por crear el primer edificio
 */
export async function celebrateFirstBuilding(
  userId: string,
  companyId: string,
  buildingName: string
) {
  return createCelebration({
    userId,
    companyId,
    type: 'first_building',
    title: '¡Primer Edificio Creado! 🏢',
    message: `Has creado "${buildingName}". Este es el primer paso para construir tu portafolio inmobiliario en INMOVA. ¡Sigue así!`,
    badgeText: 'Constructor Principiante',
    badgeColor: 'bg-blue-400 text-blue-900',
    actionLabel: 'Añadir Unidades',
    actionRoute: '/units/create',
  });
}

/**
 * Celebración por crear la primera unidad
 */
export async function celebrateFirstUnit(userId: string, companyId: string) {
  return createCelebration({
    userId,
    companyId,
    type: 'first_unit',
    title: '¡Primera Unidad Añadida! 🏠',
    message:
      'Has añadido tu primera unidad. Ahora puedes crear contratos y comenzar a generar ingresos. ¡Tu negocio está creciendo!',
    badgeText: 'Propietario Activo',
    badgeColor: 'bg-green-400 text-green-900',
    actionLabel: 'Crear Contrato',
    actionRoute: '/contracts/create',
  });
}

/**
 * Celebración por crear el primer contrato
 */
export async function celebrateFirstContract(userId: string, companyId: string) {
  return createCelebration({
    userId,
    companyId,
    type: 'first_contract',
    title: '¡Primer Contrato Firmado! 📝',
    message:
      'Has creado tu primer contrato de alquiler. INMOVA gestionará automáticamente los pagos, recordatorios y renovaciones. ¡Excelente trabajo!',
    badgeText: 'Gestor Profesional',
    badgeColor: 'bg-purple-400 text-purple-900',
    actionLabel: 'Ver Contratos',
    actionRoute: '/contracts',
  });
}

/**
 * Celebración por llegar a 10 propiedades
 */
export async function celebrateMilestone10Properties(userId: string, companyId: string) {
  return createCelebration({
    userId,
    companyId,
    type: 'milestone_10_properties',
    title: '¡10 Propiedades! 🎆',
    message:
      'Has alcanzado las 10 propiedades en tu portafolio. ¡Estás construyendo un imperio inmobiliario!',
    badgeText: 'Propietario Establecido',
    badgeColor: 'bg-orange-400 text-orange-900',
    actionLabel: 'Ver Portafolio',
    actionRoute: '/buildings',
  });
}

/**
 * Celebración por ser usuario avanzado
 */
export async function celebratePowerUser(userId: string, companyId: string) {
  return createCelebration({
    userId,
    companyId,
    type: 'power_user',
    title: '¡Eres un Power User! ⚡',
    message:
      'Has desbloqueado más del 80% de las funcionalidades de INMOVA. ¡Eres un experto en la plataforma!',
    badgeText: 'Master INMOVA',
    badgeColor: 'bg-indigo-400 text-indigo-900',
  });
}

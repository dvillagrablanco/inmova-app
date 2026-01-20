/**
 * SERVICIO DE PREFERENCIAS DE USUARIO
 * Gestiona módulos activos, tours completados y configuraciones personalizadas
 */

import prisma from './db';
import { getDefaultActiveModules, validateModuleDependencies, MODULES } from './modules-management-system';
import type { UserRole, BusinessVertical } from '@prisma/client';

import logger from '@/lib/logger';
export interface UserPreferences {
  activeModules: string[];
  completedTours: string[];
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
  vertical: string;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  enableTooltips: boolean;
  enableChatbot: boolean;
  enableVideos: boolean;
  autoplayTours: boolean;
  notificationsEnabled: boolean;
}

/**
 * Obtiene preferencias del usuario
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  if (!user || !user.preferences) {
    // Preferencias por defecto
    return {
      activeModules: [],
      completedTours: [],
      experienceLevel: 'intermedio',
      vertical: 'alquiler_tradicional',
      theme: 'light',
      language: 'es',
      enableTooltips: true,
      enableChatbot: true,
      enableVideos: true,
      autoplayTours: true,
      notificationsEnabled: true
    };
  }

  return user.preferences as unknown as UserPreferences;
}

/**
 * Actualiza preferencias del usuario
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences(userId);
  const updated = { ...current, ...preferences };

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: updated as any }
  });

  return updated;
}

/**
 * Activa un módulo para el usuario
 */
export async function activateModule(
  userId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string; activeModules?: string[] }> {
  try {
    // Verificar que el módulo existe
    const module = MODULES[moduleId];
    if (!module) {
      return { success: false, error: 'Módulo no encontrado' };
    }

    // Obtener preferencias actuales
    const prefs = await getUserPreferences(userId);

    // Verificar si ya está activo
    if (prefs.activeModules.includes(moduleId)) {
      return { success: true, activeModules: prefs.activeModules };
    }

    // Validar dependencias
    const validation = validateModuleDependencies(moduleId, prefs.activeModules);
    if (!validation.valid) {
      return {
        success: false,
        error: `Faltan dependencias: ${validation.missingDependencies?.join(', ')}`
      };
    }

    // Activar módulo
    const newActiveModules = [...prefs.activeModules, moduleId];
    await updateUserPreferences(userId, { activeModules: newActiveModules });

    return { success: true, activeModules: newActiveModules };
  } catch (error: any) {
    logger.error('Error activando módulo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desactiva un módulo para el usuario
 */
export async function deactivateModule(
  userId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string; activeModules?: string[] }> {
  try {
    const prefs = await getUserPreferences(userId);

    // Verificar si está activo
    if (!prefs.activeModules.includes(moduleId)) {
      return { success: true, activeModules: prefs.activeModules };
    }

    // Verificar dependencias inversas (módulos que dependen de este)
    const dependentModules = Object.values(MODULES)
      .filter(m => 
        m.dependencies?.includes(moduleId) && 
        prefs.activeModules.includes(m.id)
      )
      .map(m => m.name);

    if (dependentModules.length > 0) {
      return {
        success: false,
        error: `Otros módulos dependen de este: ${dependentModules.join(', ')}`
      };
    }

    // Desactivar módulo
    const newActiveModules = prefs.activeModules.filter(id => id !== moduleId);
    await updateUserPreferences(userId, { activeModules: newActiveModules });

    return { success: true, activeModules: newActiveModules };
  } catch (error: any) {
    logger.error('Error desactivando módulo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marca un tour como completado
 */
export async function completeTour(
  userId: string,
  tourId: string
): Promise<{ success: boolean; completedTours: string[] }> {
  try {
    const prefs = await getUserPreferences(userId);

    if (prefs.completedTours.includes(tourId)) {
      return { success: true, completedTours: prefs.completedTours };
    }

    const newCompletedTours = [...prefs.completedTours, tourId];
    await updateUserPreferences(userId, { completedTours: newCompletedTours });

    return { success: true, completedTours: newCompletedTours };
  } catch (error: any) {
    logger.error('Error completando tour:', error);
    return { success: false, completedTours: [] };
  }
}

/**
 * Resetea un tour (para poder volver a verlo)
 */
export async function resetTour(
  userId: string,
  tourId: string
): Promise<{ success: boolean; completedTours: string[] }> {
  try {
    const prefs = await getUserPreferences(userId);
    const newCompletedTours = prefs.completedTours.filter(id => id !== tourId);
    
    await updateUserPreferences(userId, { completedTours: newCompletedTours });

    return { success: true, completedTours: newCompletedTours };
  } catch (error: any) {
    logger.error('Error reseteando tour:', error);
    return { success: false, completedTours: [] };
  }
}

/**
 * Inicializa módulos por defecto según experiencia
 */
export async function initializeDefaultModules(
  userId: string,
  role: UserRole,
  vertical: BusinessVertical,
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado'
): Promise<string[]> {
  try {
    const defaultModules = getDefaultActiveModules(role, vertical, experienceLevel);
    
    await updateUserPreferences(userId, {
      activeModules: defaultModules,
      experienceLevel,
      vertical: vertical as string
    });

    return defaultModules;
  } catch (error: any) {
    logger.error('Error inicializando módulos:', error);
    return [];
  }
}

/**
 * Cambia el nivel de experiencia y ajusta módulos
 */
export async function changeExperienceLevel(
  userId: string,
  newLevel: 'principiante' | 'intermedio' | 'avanzado',
  adjustModules: boolean = true
): Promise<{ success: boolean; activeModules?: string[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true }
    });

    if (!user) {
      return { success: false };
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { businessVertical: true }
    });

    if (!company) {
      return { success: false };
    }

    // Actualizar nivel de experiencia
    await updateUserPreferences(userId, { experienceLevel: newLevel });

    if (adjustModules) {
      // Recalcular módulos según nuevo nivel
      const newModules = getDefaultActiveModules(
        user.role,
        company.businessVertical,
        newLevel
      );

      await updateUserPreferences(userId, { activeModules: newModules });
      return { success: true, activeModules: newModules };
    }

    return { success: true };
  } catch (error: any) {
    logger.error('Error cambiando nivel de experiencia:', error);
    return { success: false };
  }
}

/**
 * Obtiene estadísticas de uso de módulos
 */
export async function getModuleUsageStats(userId: string) {
  const prefs = await getUserPreferences(userId);
  
  return {
    totalModules: Object.keys(MODULES).length,
    activeModules: prefs.activeModules.length,
    completedTours: prefs.completedTours.length,
    experienceLevel: prefs.experienceLevel,
    utilizationRate: Math.round(
      (prefs.activeModules.length / Object.keys(MODULES).length) * 100
    )
  };
}

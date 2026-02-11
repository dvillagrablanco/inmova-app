/**
 * SERVICIO DE PREFERENCIAS DE USUARIO
 * Gestiona módulos activos, tours completados y configuraciones personalizadas
 * 
 * NOTA: Usa setupProgress (JSON string) para almacenar preferencias extendidas
 * y campos existentes en User para datos específicos.
 */

import prisma from './db';
import { getDefaultActiveModules, validateModuleDependencies, MODULES } from './modules-management-system';
import type { UserRole } from '@/types/prisma-types';
import type { BusinessVertical } from '@/types/prisma-types';

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

interface SetupProgressData {
  completedTours: string[];
  activeModules: string[];
  theme: string;
  language: string;
  enableTooltips: boolean;
  enableChatbot: boolean;
  enableVideos: boolean;
  autoplayTours: boolean;
  notificationsEnabled: boolean;
}

/**
 * Parsea el campo setupProgress de forma segura
 */
function parseSetupProgress(setupProgress: string | null): SetupProgressData {
  const defaults: SetupProgressData = {
    completedTours: [],
    activeModules: [],
    theme: 'light',
    language: 'es',
    enableTooltips: true,
    enableChatbot: true,
    enableVideos: true,
    autoplayTours: true,
    notificationsEnabled: true
  };
  
  if (!setupProgress) return defaults;
  
  try {
    const parsed = JSON.parse(setupProgress);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

/**
 * Obtiene preferencias del usuario
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        setupProgress: true,
        experienceLevel: true,
        businessVertical: true,
        preferredModules: true
      }
    });

    if (!user) {
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

    // Parsear setupProgress que contiene preferencias extendidas
    const setupData = parseSetupProgress(user.setupProgress);

    return {
      activeModules: setupData.activeModules || user.preferredModules || [],
      completedTours: setupData.completedTours || [],
      experienceLevel: (user.experienceLevel as 'principiante' | 'intermedio' | 'avanzado') || 'intermedio',
      vertical: user.businessVertical || 'alquiler_tradicional',
      theme: setupData.theme as 'light' | 'dark' || 'light',
      language: setupData.language as 'es' | 'en' || 'es',
      enableTooltips: setupData.enableTooltips ?? true,
      enableChatbot: setupData.enableChatbot ?? true,
      enableVideos: setupData.enableVideos ?? true,
      autoplayTours: setupData.autoplayTours ?? true,
      notificationsEnabled: setupData.notificationsEnabled ?? true
    };
  } catch (error) {
    logger.error('Error obteniendo preferencias:', error);
    // Devolver preferencias por defecto en caso de error
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
}

/**
 * Actualiza preferencias del usuario
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const current = await getUserPreferences(userId);
    const updated = { ...current, ...preferences };

    // Preparar datos para setupProgress (JSON string)
    const setupProgressData: SetupProgressData = {
      completedTours: updated.completedTours,
      activeModules: updated.activeModules,
      theme: updated.theme,
      language: updated.language,
      enableTooltips: updated.enableTooltips,
      enableChatbot: updated.enableChatbot,
      enableVideos: updated.enableVideos,
      autoplayTours: updated.autoplayTours,
      notificationsEnabled: updated.notificationsEnabled
    };

    // Actualizar usando campos existentes en User
    await prisma.user.update({
      where: { id: userId },
      data: { 
        setupProgress: JSON.stringify(setupProgressData),
        // Actualizar experienceLevel si se proporciona
        ...(preferences.experienceLevel && { 
          experienceLevel: preferences.experienceLevel as any 
        })
      }
    });

    return updated;
  } catch (error) {
    logger.error('Error actualizando preferencias:', error);
    throw error;
  }
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

/**
 * Servicio de Gamificación para eWoorker
 *
 * Sistema de puntos, niveles y logros para incentivar uso de la plataforma.
 *
 * @module EwoorkerGamificationService
 */

import { prisma } from './db';
import logger from './logger';
import { ewoorkerNotifications } from './ewoorker-notifications-service';

// ============================================================================
// CONFIGURACIÓN DE PUNTOS
// ============================================================================

export const POINT_VALUES = {
  // Onboarding
  COMPLETE_PROFILE: 100,
  UPLOAD_DOCUMENT: 50,
  GET_VERIFIED: 500,
  COMPLETE_ONBOARDING: 200,

  // Obras
  PUBLISH_OBRA: 100,
  RECEIVE_OFERTA: 25,
  ACCEPT_OFERTA: 150,
  COMPLETE_OBRA: 500,

  // Ofertas
  MAKE_OFERTA: 50,
  WIN_OFERTA: 300,

  // Contratos
  SIGN_CONTRACT: 200,
  COMPLETE_MILESTONE: 100,
  ON_TIME_DELIVERY: 250,

  // Social
  WRITE_REVIEW: 75,
  RECEIVE_5_STAR_REVIEW: 200,
  REFER_COMPANY: 500,
  REFERRED_COMPANY_VERIFIED: 1000,

  // Engagement
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 100,
  MONTHLY_STREAK: 500,

  // Chat
  FIRST_MESSAGE: 25,
  RESPOND_WITHIN_1H: 50,
};

// ============================================================================
// NIVELES
// ============================================================================

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  benefits: string[];
}

export const LEVELS: Level[] = [
  {
    level: 1,
    name: 'Novato',
    minPoints: 0,
    icon: '🏗️',
    benefits: ['Acceso básico a la plataforma'],
  },
  {
    level: 2,
    name: 'Aprendiz',
    minPoints: 500,
    icon: '🔧',
    benefits: ['Badge visible en perfil', '5% descuento en verificación'],
  },
  {
    level: 3,
    name: 'Oficial',
    minPoints: 1500,
    icon: '⚒️',
    benefits: ['Prioridad en búsquedas (+10%)', '10% descuento en verificación'],
  },
  {
    level: 4,
    name: 'Maestro',
    minPoints: 5000,
    icon: '🏆',
    benefits: ['Prioridad en búsquedas (+25%)', 'Verificación gratuita', 'Soporte prioritario'],
  },
  {
    level: 5,
    name: 'Experto',
    minPoints: 15000,
    icon: '⭐',
    benefits: [
      'Prioridad máxima en búsquedas',
      'Acceso a obras premium',
      'Gestor de cuenta dedicado',
    ],
  },
  {
    level: 6,
    name: 'Leyenda',
    minPoints: 50000,
    icon: '👑',
    benefits: [
      'Todo lo anterior',
      'Badge exclusivo "Leyenda"',
      'Mentoría de nuevos usuarios',
      '0% comisiones primer año',
    ],
  },
];

// ============================================================================
// LOGROS (ACHIEVEMENTS)
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ONBOARDING' | 'OBRAS' | 'CONTRATOS' | 'SOCIAL' | 'STREAK' | 'ESPECIAL';
  requirement: {
    type: string;
    value: number;
  };
  points: number;
  rarity: 'COMUN' | 'RARO' | 'EPICO' | 'LEGENDARIO';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Onboarding
  {
    id: 'FIRST_STEPS',
    name: 'Primeros Pasos',
    description: 'Completa el onboarding',
    icon: '👣',
    category: 'ONBOARDING',
    requirement: { type: 'COMPLETE_ONBOARDING', value: 1 },
    points: 100,
    rarity: 'COMUN',
  },
  {
    id: 'VERIFIED_PRO',
    name: 'Profesional Verificado',
    description: 'Consigue la verificación de empresa',
    icon: '✅',
    category: 'ONBOARDING',
    requirement: { type: 'GET_VERIFIED', value: 1 },
    points: 250,
    rarity: 'RARO',
  },

  // Obras
  {
    id: 'FIRST_OBRA',
    name: 'Primera Obra',
    description: 'Publica tu primera obra',
    icon: '🏗️',
    category: 'OBRAS',
    requirement: { type: 'PUBLISH_OBRA', value: 1 },
    points: 100,
    rarity: 'COMUN',
  },
  {
    id: 'PROLIFIC_PUBLISHER',
    name: 'Publicador Prolífico',
    description: 'Publica 10 obras',
    icon: '📋',
    category: 'OBRAS',
    requirement: { type: 'PUBLISH_OBRA', value: 10 },
    points: 500,
    rarity: 'RARO',
  },
  {
    id: 'MASTER_BUILDER',
    name: 'Maestro Constructor',
    description: 'Completa 50 obras',
    icon: '🏛️',
    category: 'OBRAS',
    requirement: { type: 'COMPLETE_OBRA', value: 50 },
    points: 2000,
    rarity: 'LEGENDARIO',
  },

  // Contratos
  {
    id: 'FIRST_CONTRACT',
    name: 'Primer Contrato',
    description: 'Firma tu primer contrato',
    icon: '📝',
    category: 'CONTRATOS',
    requirement: { type: 'SIGN_CONTRACT', value: 1 },
    points: 150,
    rarity: 'COMUN',
  },
  {
    id: 'RELIABLE_PARTNER',
    name: 'Socio Fiable',
    description: 'Entrega 10 proyectos a tiempo',
    icon: '⏰',
    category: 'CONTRATOS',
    requirement: { type: 'ON_TIME_DELIVERY', value: 10 },
    points: 1000,
    rarity: 'EPICO',
  },

  // Social
  {
    id: 'FIRST_REVIEW',
    name: 'Crítico Novato',
    description: 'Escribe tu primera valoración',
    icon: '✍️',
    category: 'SOCIAL',
    requirement: { type: 'WRITE_REVIEW', value: 1 },
    points: 50,
    rarity: 'COMUN',
  },
  {
    id: 'TOP_RATED',
    name: 'Top Rated',
    description: 'Recibe 10 valoraciones de 5 estrellas',
    icon: '🌟',
    category: 'SOCIAL',
    requirement: { type: 'RECEIVE_5_STAR_REVIEW', value: 10 },
    points: 1500,
    rarity: 'EPICO',
  },
  {
    id: 'NETWORK_BUILDER',
    name: 'Constructor de Red',
    description: 'Refiere 5 empresas que se verifiquen',
    icon: '🕸️',
    category: 'SOCIAL',
    requirement: { type: 'REFERRED_COMPANY_VERIFIED', value: 5 },
    points: 2500,
    rarity: 'LEGENDARIO',
  },

  // Streaks
  {
    id: 'WEEKLY_WARRIOR',
    name: 'Guerrero Semanal',
    description: 'Inicia sesión 7 días seguidos',
    icon: '🔥',
    category: 'STREAK',
    requirement: { type: 'DAILY_LOGIN_STREAK', value: 7 },
    points: 200,
    rarity: 'RARO',
  },
  {
    id: 'MONTHLY_MASTER',
    name: 'Maestro Mensual',
    description: 'Inicia sesión 30 días seguidos',
    icon: '💎',
    category: 'STREAK',
    requirement: { type: 'DAILY_LOGIN_STREAK', value: 30 },
    points: 1000,
    rarity: 'EPICO',
  },

  // Especiales
  {
    id: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Te uniste en el primer año de eWoorker',
    icon: '🚀',
    category: 'ESPECIAL',
    requirement: { type: 'REGISTRATION_DATE', value: 2026 },
    points: 500,
    rarity: 'LEGENDARIO',
  },
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerGamificationService {
  /**
   * Añade puntos a una empresa
   */
  async addPoints(
    perfilEmpresaId: string,
    action: keyof typeof POINT_VALUES,
    metadata?: Record<string, any>
  ): Promise<{ points: number; newTotal: number; levelUp?: Level }> {
    try {
      const points = POINT_VALUES[action];

      // Obtener perfil actual
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        select: { gamificationPoints: true, gamificationLevel: true, companyId: true },
      });

      if (!perfil) {
        return { points: 0, newTotal: 0 };
      }

      const currentPoints = perfil.gamificationPoints || 0;
      const newTotal = currentPoints + points;

      // Verificar si sube de nivel
      const currentLevel = this.getLevelByPoints(currentPoints);
      const newLevel = this.getLevelByPoints(newTotal);
      const levelUp = newLevel.level > currentLevel.level ? newLevel : undefined;

      // Actualizar puntos
      await prisma.ewoorkerPerfilEmpresa.update({
        where: { id: perfilEmpresaId },
        data: {
          gamificationPoints: newTotal,
          gamificationLevel: newLevel.level,
        },
      });

      // Registrar la transacción de puntos
      await prisma.ewoorkerPuntosLog.create({
        data: {
          perfilEmpresaId,
          action,
          points,
          totalAfter: newTotal,
          metadata: metadata || {},
        },
      });

      // Notificar subida de nivel
      if (levelUp) {
        const users = await prisma.user.findMany({
          where: { companyId: perfil.companyId, activo: true },
          select: { id: true },
        });

        for (const user of users) {
          await ewoorkerNotifications.sendPushToUser(user.id, {
            type: 'VERIFICACION_APROBADA', // Reusar tipo para notificación positiva
            title: `🎉 ¡Subiste al nivel ${levelUp.level}!`,
            body: `Ahora eres ${levelUp.icon} ${levelUp.name}. ${levelUp.benefits[0]}`,
            url: '/ewoorker/perfil/logros',
            priority: 'normal',
          });
        }
      }

      logger.debug('[EwoorkerGamification] Puntos añadidos:', {
        perfilEmpresaId,
        action,
        points,
        newTotal,
        levelUp: levelUp?.name,
      });

      return { points, newTotal, levelUp };
    } catch (error: any) {
      logger.error('[EwoorkerGamification] Error añadiendo puntos:', error);
      return { points: 0, newTotal: 0 };
    }
  }

  /**
   * Obtiene el perfil de gamificación de una empresa
   */
  async getProfile(perfilEmpresaId: string): Promise<{
    points: number;
    level: Level;
    nextLevel: Level | null;
    progressToNextLevel: number;
    achievements: { achievement: Achievement; unlockedAt: Date }[];
    recentActivity: { action: string; points: number; createdAt: Date }[];
    rank?: number;
  } | null> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        select: {
          gamificationPoints: true,
          gamificationLevel: true,
          gamificationAchievements: true,
        },
      });

      if (!perfil) return null;

      const points = perfil.gamificationPoints || 0;
      const level = this.getLevelByPoints(points);
      const nextLevel = LEVELS[level.level] || null; // Siguiente nivel o null si es máximo

      // Progreso hacia siguiente nivel
      let progressToNextLevel = 100;
      if (nextLevel) {
        const pointsInLevel = points - level.minPoints;
        const pointsNeeded = nextLevel.minPoints - level.minPoints;
        progressToNextLevel = Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100));
      }

      // Obtener logros desbloqueados
      const achievementIds = (perfil.gamificationAchievements as string[]) || [];
      const achievements = achievementIds
        .map((id) => {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id);
          return achievement ? { achievement, unlockedAt: new Date() } : null;
        })
        .filter(Boolean) as { achievement: Achievement; unlockedAt: Date }[];

      // Obtener actividad reciente
      const recentActivity = await prisma.ewoorkerPuntosLog.findMany({
        where: { perfilEmpresaId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, points: true, createdAt: true },
      });

      // Calcular ranking (posición entre todas las empresas)
      const rank = await prisma.ewoorkerPerfilEmpresa.count({
        where: { gamificationPoints: { gt: points } },
      });

      return {
        points,
        level,
        nextLevel,
        progressToNextLevel,
        achievements,
        recentActivity,
        rank: rank + 1,
      };
    } catch (error: any) {
      logger.error('[EwoorkerGamification] Error obteniendo perfil:', error);
      return null;
    }
  }

  /**
   * Verifica y desbloquea logros
   */
  async checkAchievements(
    perfilEmpresaId: string,
    action: string,
    currentCount: number
  ): Promise<Achievement[]> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        select: { gamificationAchievements: true, companyId: true },
      });

      if (!perfil) return [];

      const currentAchievements = (perfil.gamificationAchievements as string[]) || [];
      const unlockedNow: Achievement[] = [];

      for (const achievement of ACHIEVEMENTS) {
        // Ya desbloqueado?
        if (currentAchievements.includes(achievement.id)) continue;

        // Verifica requisito
        if (
          achievement.requirement.type === action &&
          currentCount >= achievement.requirement.value
        ) {
          unlockedNow.push(achievement);

          // Añadir a lista de logros
          await prisma.ewoorkerPerfilEmpresa.update({
            where: { id: perfilEmpresaId },
            data: {
              gamificationAchievements: [...currentAchievements, achievement.id],
            },
          });

          // Añadir puntos del logro
          await this.addPoints(perfilEmpresaId, 'COMPLETE_PROFILE', {
            achievementId: achievement.id,
            bonusPoints: achievement.points,
          });

          // Notificar
          const users = await prisma.user.findMany({
            where: { companyId: perfil.companyId, activo: true },
            select: { id: true },
          });

          for (const user of users) {
            await ewoorkerNotifications.sendPushToUser(user.id, {
              type: 'VERIFICACION_APROBADA',
              title: `🏆 ¡Logro Desbloqueado!`,
              body: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
              url: '/ewoorker/perfil/logros',
              priority: 'normal',
            });
          }
        }
      }

      return unlockedNow;
    } catch (error: any) {
      logger.error('[EwoorkerGamification] Error verificando logros:', error);
      return [];
    }
  }

  /**
   * Obtiene el leaderboard
   */
  async getLeaderboard(limit: number = 20): Promise<
    {
      rank: number;
      empresaId: string;
      empresaNombre: string;
      logo?: string;
      points: number;
      level: Level;
    }[]
  > {
    try {
      const empresas = await prisma.ewoorkerPerfilEmpresa.findMany({
        where: { activo: true },
        orderBy: { gamificationPoints: 'desc' },
        take: limit,
        select: {
          id: true,
          logoUrl: true,
          gamificationPoints: true,
          company: { select: { nombre: true } },
        },
      });

      return empresas.map((e, i) => ({
        rank: i + 1,
        empresaId: e.id,
        empresaNombre: e.company.nombre,
        logo: e.logoUrl || undefined,
        points: e.gamificationPoints || 0,
        level: this.getLevelByPoints(e.gamificationPoints || 0),
      }));
    } catch (error: any) {
      logger.error('[EwoorkerGamification] Error obteniendo leaderboard:', error);
      return [];
    }
  }

  /**
   * Registra login diario y verifica streaks
   */
  async registerDailyLogin(perfilEmpresaId: string): Promise<{
    points: number;
    streak: number;
    bonus: number;
  }> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        select: { lastLoginDate: true, loginStreak: true },
      });

      if (!perfil) return { points: 0, streak: 0, bonus: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastLogin = perfil.lastLoginDate;
      let streak = perfil.loginStreak || 0;
      let bonus = 0;

      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        lastLoginDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0) {
          // Ya logueó hoy
          return { points: 0, streak, bonus: 0 };
        } else if (daysDiff === 1) {
          // Día consecutivo
          streak++;
        } else {
          // Rompió racha
          streak = 1;
        }
      } else {
        streak = 1;
      }

      // Bonos por racha
      if (streak === 7) {
        bonus = POINT_VALUES.WEEKLY_STREAK;
        await this.checkAchievements(perfilEmpresaId, 'DAILY_LOGIN_STREAK', 7);
      } else if (streak === 30) {
        bonus = POINT_VALUES.MONTHLY_STREAK;
        await this.checkAchievements(perfilEmpresaId, 'DAILY_LOGIN_STREAK', 30);
      }

      // Actualizar perfil
      await prisma.ewoorkerPerfilEmpresa.update({
        where: { id: perfilEmpresaId },
        data: {
          lastLoginDate: new Date(),
          loginStreak: streak,
        },
      });

      // Añadir puntos
      const basePoints = POINT_VALUES.DAILY_LOGIN;
      await this.addPoints(perfilEmpresaId, 'DAILY_LOGIN', { streak });

      if (bonus > 0) {
        await this.addPoints(perfilEmpresaId, streak === 7 ? 'WEEKLY_STREAK' : 'MONTHLY_STREAK', {
          streak,
        });
      }

      return { points: basePoints, streak, bonus };
    } catch (error: any) {
      logger.error('[EwoorkerGamification] Error registrando login:', error);
      return { points: 0, streak: 0, bonus: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private getLevelByPoints(points: number): Level {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }
}

// Exportar instancia singleton
export const ewoorkerGamification = new EwoorkerGamificationService();

export default ewoorkerGamification;

/**
 * Servicio de Gamificación para Inquilinos B2C
 * Adaptado de ewoorker-gamification-service.ts
 */
import { prisma } from '@/lib/db';

// ============================================
// CONSTANTES DE GAMIFICACIÓN
// ============================================

export const TENANT_POINTS = {
  // Pagos
  PAGO_A_TIEMPO: 50,
  PAGO_ANTICIPADO: 100,
  PRIMER_PAGO: 200,

  // Incidencias y mantenimiento
  REPORTE_INCIDENCIA: 20,
  INCIDENCIA_RESUELTA: 30,
  VALORAR_SERVICIO: 30,
  VALORAR_5_ESTRELLAS: 50,

  // Perfil y documentos
  COMPLETAR_PERFIL: 100,
  SUBIR_DOCUMENTO: 25,
  VERIFICAR_IDENTIDAD: 150,

  // Contrato
  FIRMAR_CONTRATO: 200,
  RENOVAR_CONTRATO: 500,

  // Social y referidos
  REFERIR_INQUILINO: 300,
  REFERIDO_VERIFICADO: 500,

  // Engagement
  LOGIN_DIARIO: 5,
  RACHA_SEMANAL: 50, // 7 días consecutivos
  RACHA_MENSUAL_PAGOS: 200, // 3 meses pagando a tiempo
  USAR_MARKETPLACE: 20,
  PARTICIPAR_COMUNIDAD: 15,

  // Especiales
  PRIMER_ANIVERSARIO: 500,
  INQUILINO_MODELO: 1000, // Sin incidencias ni retrasos en 6 meses
} as const;

export type TenantPointAction = keyof typeof TENANT_POINTS;

export interface TenantLevel {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
  benefits: string[];
}

export const TENANT_LEVELS: TenantLevel[] = [
  {
    level: 1,
    name: 'Nuevo',
    minPoints: 0,
    icon: '🏠',
    color: 'gray',
    benefits: ['Acceso básico al portal'],
  },
  {
    level: 2,
    name: 'Residente',
    minPoints: 300,
    icon: '🌟',
    color: 'blue',
    benefits: ['5% dto en marketplace', 'Badge visible'],
  },
  {
    level: 3,
    name: 'Vecino Estrella',
    minPoints: 1000,
    icon: '⭐',
    color: 'green',
    benefits: ['10% dto en marketplace', 'Prioridad en soporte', 'Acceso a ofertas exclusivas'],
  },
  {
    level: 4,
    name: 'Embajador',
    minPoints: 3000,
    icon: '🏆',
    color: 'gold',
    benefits: [
      '15% dto en marketplace',
      'Soporte prioritario 24/7',
      'Acceso a eventos VIP',
      'Bonos por referidos x2',
    ],
  },
  {
    level: 5,
    name: 'Leyenda',
    minPoints: 10000,
    icon: '👑',
    color: 'purple',
    benefits: [
      '20% dto en marketplace',
      'Gestor dedicado',
      'Regalos de bienvenida en renovación',
      'Acceso anticipado a nuevas funcionalidades',
    ],
  },
];

export interface TenantAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'pagos' | 'comunidad' | 'perfil' | 'social' | 'especial';
  points: number;
  requirement: {
    type: TenantPointAction;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const TENANT_ACHIEVEMENTS: TenantAchievement[] = [
  // Pagos
  {
    id: 'primer_pago',
    name: 'Primera Cuota',
    description: 'Realiza tu primer pago de alquiler',
    icon: '💰',
    category: 'pagos',
    points: 50,
    requirement: { type: 'PRIMER_PAGO', value: 1 },
    rarity: 'common',
  },
  {
    id: 'pagador_puntual',
    name: 'Pagador Puntual',
    description: 'Paga 3 meses consecutivos a tiempo',
    icon: '⏰',
    category: 'pagos',
    points: 100,
    requirement: { type: 'PAGO_A_TIEMPO', value: 3 },
    rarity: 'rare',
  },
  {
    id: 'pagador_ejemplar',
    name: 'Pagador Ejemplar',
    description: 'Paga 12 meses consecutivos a tiempo',
    icon: '🎖️',
    category: 'pagos',
    points: 500,
    requirement: { type: 'PAGO_A_TIEMPO', value: 12 },
    rarity: 'epic',
  },
  {
    id: 'pagador_legendario',
    name: 'Pagador Legendario',
    description: 'Paga 24 meses consecutivos a tiempo',
    icon: '👑',
    category: 'pagos',
    points: 1000,
    requirement: { type: 'PAGO_A_TIEMPO', value: 24 },
    rarity: 'legendary',
  },

  // Comunidad
  {
    id: 'reportero',
    name: 'Reportero',
    description: 'Reporta tu primera incidencia',
    icon: '📝',
    category: 'comunidad',
    points: 25,
    requirement: { type: 'REPORTE_INCIDENCIA', value: 1 },
    rarity: 'common',
  },
  {
    id: 'critico',
    name: 'Crítico Constructivo',
    description: 'Valora 5 servicios',
    icon: '⭐',
    category: 'comunidad',
    points: 75,
    requirement: { type: 'VALORAR_SERVICIO', value: 5 },
    rarity: 'rare',
  },
  {
    id: 'vecino_activo',
    name: 'Vecino Activo',
    description: 'Participa 10 veces en la comunidad',
    icon: '🤝',
    category: 'comunidad',
    points: 100,
    requirement: { type: 'PARTICIPAR_COMUNIDAD', value: 10 },
    rarity: 'rare',
  },

  // Perfil
  {
    id: 'perfil_completo',
    name: 'Perfil Completo',
    description: 'Completa todos los datos de tu perfil',
    icon: '✅',
    category: 'perfil',
    points: 100,
    requirement: { type: 'COMPLETAR_PERFIL', value: 1 },
    rarity: 'common',
  },
  {
    id: 'verificado',
    name: 'Identidad Verificada',
    description: 'Verifica tu identidad',
    icon: '🔒',
    category: 'perfil',
    points: 150,
    requirement: { type: 'VERIFICAR_IDENTIDAD', value: 1 },
    rarity: 'rare',
  },

  // Social
  {
    id: 'embajador_social',
    name: 'Embajador Social',
    description: 'Refiere a tu primer amigo',
    icon: '🎁',
    category: 'social',
    points: 100,
    requirement: { type: 'REFERIR_INQUILINO', value: 1 },
    rarity: 'common',
  },
  {
    id: 'influencer',
    name: 'Influencer Inmobiliario',
    description: 'Refiere a 5 amigos que se conviertan en inquilinos',
    icon: '📢',
    category: 'social',
    points: 500,
    requirement: { type: 'REFERIDO_VERIFICADO', value: 5 },
    rarity: 'epic',
  },

  // Especiales
  {
    id: 'aniversario',
    name: 'Primer Aniversario',
    description: '1 año como inquilino',
    icon: '🎂',
    category: 'especial',
    points: 500,
    requirement: { type: 'PRIMER_ANIVERSARIO', value: 1 },
    rarity: 'epic',
  },
  {
    id: 'inquilino_modelo',
    name: 'Inquilino Modelo',
    description: '6 meses sin incidencias ni retrasos',
    icon: '🌟',
    category: 'especial',
    points: 1000,
    requirement: { type: 'INQUILINO_MODELO', value: 1 },
    rarity: 'legendary',
  },
];

// ============================================
// SERVICIO PRINCIPAL
// ============================================

class TenantGamificationService {
  /**
   * Añade puntos a un inquilino
   */
  async addPoints(
    tenantId: string,
    action: TenantPointAction,
    metadata: Record<string, any> = {}
  ): Promise<{
    pointsAdded: number;
    totalPoints: number;
    levelUp: boolean;
    newLevel?: TenantLevel;
    achievementsUnlocked: TenantAchievement[];
  }> {
    const points = TENANT_POINTS[action];

    // Obtener tenant con gamificación
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        gamificationPoints: true,
        gamificationLevel: true,
        gamificationAchievements: true,
        loginStreak: true,
        lastLoginDate: true,
      },
    });

    if (!tenant) {
      throw new Error('Inquilino no encontrado');
    }

    const currentPoints = tenant.gamificationPoints || 0;
    const newTotalPoints = currentPoints + points;
    const currentLevel = this.getLevelForPoints(currentPoints);
    const newLevel = this.getLevelForPoints(newTotalPoints);
    const levelUp = newLevel.level > currentLevel.level;

    // Registrar log de puntos
    await prisma.tenantGamificationLog.create({
      data: {
        tenantId,
        action,
        points,
        totalAfter: newTotalPoints,
        metadata,
      },
    });

    // Verificar logros desbloqueados
    const achievementsUnlocked = await this.checkAndUnlockAchievements(tenantId, action);

    // Actualizar puntos del tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        gamificationPoints: newTotalPoints,
        gamificationLevel: newLevel.level,
      },
    });

    return {
      pointsAdded: points,
      totalPoints: newTotalPoints,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      achievementsUnlocked,
    };
  }

  /**
   * Registra login diario y gestiona racha
   */
  async registerDailyLogin(tenantId: string): Promise<{
    pointsAdded: number;
    streak: number;
    bonusPoints: number;
  }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        loginStreak: true,
        lastLoginDate: true,
      },
    });

    if (!tenant) {
      throw new Error('Inquilino no encontrado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = tenant.lastLoginDate ? new Date(tenant.lastLoginDate) : null;
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
    }

    // Si ya hizo login hoy, no dar puntos
    if (lastLogin && lastLogin.getTime() === today.getTime()) {
      return {
        pointsAdded: 0,
        streak: tenant.loginStreak || 0,
        bonusPoints: 0,
      };
    }

    // Calcular racha
    let newStreak = 1;
    if (lastLogin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin.getTime() === yesterday.getTime()) {
        newStreak = (tenant.loginStreak || 0) + 1;
      }
    }

    // Puntos base por login
    let totalPoints = TENANT_POINTS.LOGIN_DIARIO;
    let bonusPoints = 0;

    // Bonus por racha semanal
    if (newStreak > 0 && newStreak % 7 === 0) {
      bonusPoints = TENANT_POINTS.RACHA_SEMANAL;
      totalPoints += bonusPoints;
    }

    // Actualizar tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        loginStreak: newStreak,
        lastLoginDate: today,
        gamificationPoints: { increment: totalPoints },
      },
    });

    // Registrar log
    await prisma.tenantGamificationLog.create({
      data: {
        tenantId,
        action: bonusPoints > 0 ? 'RACHA_SEMANAL' : 'LOGIN_DIARIO',
        points: totalPoints,
        totalAfter: 0, // Se actualizará en el próximo query
        metadata: { streak: newStreak },
      },
    });

    return {
      pointsAdded: totalPoints,
      streak: newStreak,
      bonusPoints,
    };
  }

  /**
   * Obtiene el perfil de gamificación completo
   */
  async getGamificationProfile(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        nombreCompleto: true,
        gamificationPoints: true,
        gamificationLevel: true,
        gamificationAchievements: true,
        loginStreak: true,
        lastLoginDate: true,
      },
    });

    if (!tenant) {
      throw new Error('Inquilino no encontrado');
    }

    const points = tenant.gamificationPoints || 0;
    const currentLevel = this.getLevelForPoints(points);
    const nextLevel = TENANT_LEVELS.find((l) => l.level === currentLevel.level + 1);

    // Obtener logros desbloqueados
    const achievementIds = (tenant.gamificationAchievements as string[]) || [];
    const achievements = achievementIds
      .map((id) => {
        const achievement = TENANT_ACHIEVEMENTS.find((a) => a.id === id);
        return achievement ? { achievement, unlockedAt: new Date() } : null;
      })
      .filter(Boolean) as { achievement: TenantAchievement; unlockedAt: Date }[];

    // Obtener actividad reciente
    const recentActivity = await prisma.tenantGamificationLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calcular progreso al siguiente nivel
    const progressToNextLevel = nextLevel
      ? Math.round(
          ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
        )
      : 100;

    return {
      tenantId,
      tenantName: tenant.nombreCompleto,
      points,
      level: currentLevel,
      nextLevel,
      progressToNextLevel,
      loginStreak: tenant.loginStreak || 0,
      achievements,
      recentActivity,
      allAchievements: TENANT_ACHIEVEMENTS,
      unlockedCount: achievements.length,
      totalAchievements: TENANT_ACHIEVEMENTS.length,
    };
  }

  /**
   * Obtiene el leaderboard de inquilinos
   */
  async getLeaderboard(
    companyId?: string,
    limit: number = 10
  ): Promise<
    Array<{
      rank: number;
      tenantId: string;
      tenantName: string;
      points: number;
      level: TenantLevel;
    }>
  > {
    const tenants = await prisma.tenant.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { gamificationPoints: 'desc' },
      take: limit,
      select: {
        id: true,
        nombreCompleto: true,
        gamificationPoints: true,
        gamificationLevel: true,
      },
    });

    return tenants.map((tenant, index) => ({
      rank: index + 1,
      tenantId: tenant.id,
      tenantName: tenant.nombreCompleto,
      points: tenant.gamificationPoints || 0,
      level: this.getLevelForPoints(tenant.gamificationPoints || 0),
    }));
  }

  /**
   * Obtiene el nivel para una cantidad de puntos
   */
  getLevelForPoints(points: number): TenantLevel {
    for (let i = TENANT_LEVELS.length - 1; i >= 0; i--) {
      if (points >= TENANT_LEVELS[i].minPoints) {
        return TENANT_LEVELS[i];
      }
    }
    return TENANT_LEVELS[0];
  }

  /**
   * Verifica y desbloquea logros
   */
  private async checkAndUnlockAchievements(
    tenantId: string,
    action: TenantPointAction
  ): Promise<TenantAchievement[]> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { gamificationAchievements: true },
    });

    const unlockedIds = (tenant?.gamificationAchievements as string[]) || [];
    const unlockedNow: TenantAchievement[] = [];

    // Contar acciones del tipo actual
    const actionCount = await prisma.tenantGamificationLog.count({
      where: { tenantId, action },
    });

    for (const achievement of TENANT_ACHIEVEMENTS) {
      // Si ya está desbloqueado, saltar
      if (unlockedIds.includes(achievement.id)) continue;

      // Verificar requisito
      if (achievement.requirement.type === action && actionCount >= achievement.requirement.value) {
        unlockedNow.push(achievement);

        // Actualizar logros del tenant
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            gamificationAchievements: [...unlockedIds, achievement.id],
            gamificationPoints: { increment: achievement.points },
          },
        });

        // Registrar log
        await prisma.tenantGamificationLog.create({
          data: {
            tenantId,
            action: 'ACHIEVEMENT_UNLOCKED' as any,
            points: achievement.points,
            totalAfter: 0,
            metadata: { achievementId: achievement.id, achievementName: achievement.name },
          },
        });

        unlockedIds.push(achievement.id);
      }
    }

    return unlockedNow;
  }
}

export const tenantGamification = new TenantGamificationService();

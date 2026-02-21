// Sistema de Gamificación Mejorado para Inquilinos
// Basado en el documento MEJORAS_PRIORITARIAS_POR_PERFIL.md

// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================
// TIPOS Y CONSTANTES
// ============================================

export interface TenantGamificationData {
  tenantId: string;
  nivel: number;
  experiencia: number;
  puntos: number;
  racha: number;
  badges: BadgeEarned[];
  ranking: {
    edificio?: number;
    ciudad?: number;
    global?: number;
  };
  proximoNivel: {
    nivel: number;
    experienciaRequerida: number;
    experienciaFaltante: number;
  };
}

export interface BadgeEarned {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  rareza: 'comun' | 'rara' | 'epica' | 'legendaria';
  conseguidoEn: Date;
}

export interface RewardItem {
  id: string;
  nombre: string;
  descripcion: string;
  costoPuntos: number;
  tipo: 'descuento' | 'upgrade' | 'servicio' | 'fisico';
  valor?: number;
  disponible: boolean;
}

export interface PuntoHistoryItem {
  tipo: string;
  puntos: number;
  descripcion: string;
  fecha: Date;
}

// Configuración de niveles
const NIVEL_CONFIG = [
  { nivel: 1, experienciaRequerida: 0 },
  { nivel: 2, experienciaRequerida: 100 },
  { nivel: 3, experienciaRequerida: 250 },
  { nivel: 4, experienciaRequerida: 500 },
  { nivel: 5, experienciaRequerida: 1000 },
  { nivel: 6, experienciaRequerida: 1500 },
  { nivel: 7, experienciaRequerida: 2500 },
  { nivel: 8, experienciaRequerida: 4000 },
  { nivel: 9, experienciaRequerida: 6000 },
  { nivel: 10, experienciaRequerida: 10000 },
];

// Definición de badges predefinidos
const BADGE_DEFINITIONS = [
  {
    codigo: 'pago_puntual_3',
    nombre: 'Pagador Puntual',
    descripcion: 'Realizaste 3 pagos a tiempo consecutivos',
    icono: '💳',
    rareza: 'comun' as const,
    tipoCriterio: 'pagos_puntuales',
    metaNumero: 3,
  },
  {
    codigo: 'pago_puntual_10',
    nombre: 'Pagador Ejemplar',
    descripcion: 'Realizaste 10 pagos a tiempo consecutivos',
    icono: '🏆',
    rareza: 'rara' as const,
    tipoCriterio: 'pagos_puntuales',
    metaNumero: 10,
  },
  {
    codigo: 'pago_puntual_50',
    nombre: 'Leyenda del Pago',
    descripcion: 'Realizaste 50 pagos a tiempo consecutivos',
    icono: '👑',
    rareza: 'legendaria' as const,
    tipoCriterio: 'pagos_puntuales',
    metaNumero: 50,
  },
  {
    codigo: 'limpieza_5',
    nombre: 'Limpio y Ordenado',
    descripcion: 'Completaste 5 turnos de limpieza',
    icono: '🧹',
    rareza: 'comun' as const,
    tipoCriterio: 'limpieza',
    metaNumero: 5,
  },
  {
    codigo: 'vecino_ejemplar',
    nombre: 'Vecino Ejemplar',
    descripcion: 'Sin quejas de vecinos por 6 meses',
    icono: '🤝',
    rareza: 'epica' as const,
    tipoCriterio: 'convivencia',
    metaNumero: 180,
  },
  {
    codigo: 'eco_warrior',
    nombre: 'Eco Guerrero',
    descripcion: 'Reciclaste correctamente por 10 semanas',
    icono: '♻️',
    rareza: 'rara' as const,
    tipoCriterio: 'reciclaje',
    metaNumero: 10,
  },
  {
    codigo: 'referidor',
    nombre: 'Embajador',
    descripcion: 'Referiste 3 nuevos inquilinos',
    icono: '🎯',
    rareza: 'epica' as const,
    tipoCriterio: 'referidos',
    metaNumero: 3,
  },
  {
    codigo: 'racha_30',
    nombre: 'Racha Imparable',
    descripcion: 'Mantuviste una racha de 30 días',
    icono: '🔥',
    rareza: 'rara' as const,
    tipoCriterio: 'racha',
    metaNumero: 30,
  },
];

// Catálogo de rewards por defecto
const DEFAULT_REWARDS = [
  // Nivel Básico
  {
    nombre: 'Vale 25€ descuento',
    descripcion: 'Descuento de 25€ en tu próxima renta',
    costoPuntos: 500,
    tipo: 'descuento' as const,
    valor: 25,
  },
  {
    nombre: 'Limpieza gratis',
    descripcion: 'Servicio de limpieza profesional gratuito',
    costoPuntos: 750,
    tipo: 'servicio' as const,
  },
  // Nivel Intermedio
  {
    nombre: 'Vale 50€ descuento',
    descripcion: 'Descuento de 50€ en tu próxima renta',
    costoPuntos: 1000,
    tipo: 'descuento' as const,
    valor: 50,
  },
  {
    nombre: 'Upgrade habitación 1 mes',
    descripcion: 'Mejora a una habitación superior por 1 mes',
    costoPuntos: 1500,
    tipo: 'upgrade' as const,
  },
  {
    nombre: 'Parking gratuito 1 mes',
    descripcion: 'Uso de parking gratuito durante 1 mes',
    costoPuntos: 1200,
    tipo: 'servicio' as const,
  },
  // Nivel Premium
  {
    nombre: 'Vale 100€ descuento',
    descripcion: 'Descuento de 100€ en tu próxima renta',
    costoPuntos: 2500,
    tipo: 'descuento' as const,
    valor: 100,
  },
  {
    nombre: '1 mes renta gratis',
    descripcion: 'Un mes completamente gratis de renta',
    costoPuntos: 5000,
    tipo: 'descuento' as const,
    valor: 100,
  },
  // Nivel Legendario
  {
    nombre: '3 meses renta gratis',
    descripcion: 'Tres meses completamente gratis de renta',
    costoPuntos: 15000,
    tipo: 'descuento' as const,
    valor: 100,
  },
  {
    nombre: 'Renovación con 10% descuento',
    descripcion: 'Descuento permanente del 10% en renovación de contrato',
    costoPuntos: 10000,
    tipo: 'descuento' as const,
    valor: 10,
  },
];

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene o crea los datos de gamificación de un inquilino
 */
export async function getOrCreateTenantGamification(
  tenantId: string
): Promise<TenantGamificationData> {
  // Buscar reputation existente (modelo actual)
  let reputation = await prisma.tenantReputation.findUnique({
    where: { tenantId },
    include: { badges: true },
  });

  // Si no existe, crear
  if (!reputation) {
    reputation = await prisma.tenantReputation.create({
      data: {
        tenantId,
        puntos: 0,
        nivel: 'novato',
      },
      include: { badges: true },
    });
  }

  // Calcular nivel y experiencia basado en puntos
  const nivel = calculateLevel(reputation.puntos);
  const experiencia = reputation.puntos;
  const proximoNivel = getNextLevel(nivel, experiencia);

  // Convertir badges al formato nuevo
  const badgesEarned: BadgeEarned[] = reputation.badges.map((badge) => ({
    id: badge.id,
    codigo: badge.codigo,
    nombre: badge.nombre,
    descripcion: badge.descripcion || '',
    icono: badge.icono || '🏆',
    rareza: 'comun' as const, // Valor por defecto
    conseguidoEn: badge.obtenidoEn,
  }));

  return {
    tenantId,
    nivel,
    experiencia,
    puntos: reputation.puntos,
    racha: 0, // Por ahora sin implementar racha completa
    badges: badgesEarned,
    ranking: {},
    proximoNivel,
  };
}

/**
 * Agrega puntos a un inquilino y verifica badges/nivel
 */
export async function addPoints(
  tenantId: string,
  tipo: string,
  puntos: number,
  descripcion: string,
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<TenantGamificationData> {
  // Actualizar puntos
  const reputation = await prisma.tenantReputation.update({
    where: { tenantId },
    data: {
      puntos: {
        increment: puntos,
      },
    },
  });

  // Crear entrada en historial (usando campo JSON por ahora)
  // Esto se guardará en un sistema de logs separado o en notas

  // Verificar si se ganaron nuevos badges
  await checkAndAwardBadges(tenantId);

  // Retornar datos actualizados
  return getOrCreateTenantGamification(tenantId);
}

/**
 * Verifica y otorga badges automáticamente basados en logros
 */
export async function checkAndAwardBadges(
  tenantId: string
): Promise<BadgeEarned[]> {
  const newBadges: BadgeEarned[] = [];

  // Obtener datos del inquilino
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: true,
      reputation: {
        include: { badges: true },
      },
    },
  });

  if (!tenant || !tenant.reputation) return [];

  // Obtener badges ya ganados
  const earnedBadgeCodes = tenant.reputation.badges.map((b) => b.codigo);

  // Verificar cada badge predefinido
  for (const badgeDef of BADGE_DEFINITIONS) {
    // Si ya lo tiene, skip
    if (earnedBadgeCodes.includes(badgeDef.codigo)) continue;

    let shouldAward = false;

    // Lógica de verificación según tipo
    switch (badgeDef.tipoCriterio) {
      case 'pagos_puntuales':
        // Contar pagos puntuales (esto es simplificado)
        // En producción, verificar contra Payment records
        if (tenant.reputation.puntos >= badgeDef.metaNumero * 100) {
          shouldAward = true;
        }
        break;

      case 'limpieza':
        // Verificar turnos de limpieza completados
        // Por ahora simplificado
        break;

      case 'convivencia':
        // Verificar que no haya quejas
        break;

      case 'reciclaje':
        // Verificar reciclaje
        break;

      case 'referidos':
        // Contar referidos
        break;

      case 'racha':
        // Verificar racha de días
        break;
    }

    // Si debe otorgarse, crear badge
    if (shouldAward) {
      const badge = await prisma.badge.create({
        data: {
          reputationId: tenant.reputation.id,
          codigo: badgeDef.codigo,
          nombre: badgeDef.nombre,
          descripcion: badgeDef.descripcion,
          icono: badgeDef.icono,
        },
      });

      newBadges.push({
        id: badge.id,
        codigo: badge.codigo,
        nombre: badge.nombre,
        descripcion: badge.descripcion || '',
        icono: badge.icono || '🏆',
        rareza: badgeDef.rareza,
        conseguidoEn: badge.obtenidoEn,
      });

      // Agregar puntos bonus por conseguir el badge
      await addPoints(
        tenantId,
        'badge_earned',
        50,
        `Conseguiste el badge: ${badgeDef.nombre}`
      );
    }
  }

  return newBadges;
}

/**
 * Obtiene el catálogo de rewards disponibles
 */
export async function getRewardCatalog(
  companyId: string
): Promise<RewardItem[]> {
  // Por ahora retornar rewards predefinidos
  // En producción, esto vendría de la DB
  return DEFAULT_REWARDS.map((reward, index) => ({
    id: `reward_${index}`,
    ...reward,
    disponible: true,
  }));
}

/**
 * Canjea un reward
 */
export async function redeemReward(
  tenantId: string,
  rewardId: string,
  costoPuntos: number
): Promise<{ success: boolean; message: string }> {
  // Verificar puntos suficientes
  const gamification = await getOrCreateTenantGamification(tenantId);

  if (gamification.puntos < costoPuntos) {
    return {
      success: false,
      message: 'No tienes suficientes puntos para este reward',
    };
  }

  // Descontar puntos
  await prisma.tenantReputation.update({
    where: { tenantId },
    data: {
      puntos: {
        decrement: costoPuntos,
      },
    },
  });

  // Crear registro de canje (por ahora en logs/notas)
  // En producción, crear en tabla RedeemedReward

  return {
    success: true,
    message: 'Reward canjeado exitosamente',
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function calculateLevel(puntos: number): number {
  let nivel = 1;
  for (const config of NIVEL_CONFIG) {
    if (puntos >= config.experienciaRequerida) {
      nivel = config.nivel;
    } else {
      break;
    }
  }
  return nivel;
}

function getNextLevel(
  nivelActual: number,
  experienciaActual: number
): { nivel: number; experienciaRequerida: number; experienciaFaltante: number } {
  const nextLevelConfig = NIVEL_CONFIG.find(
    (c) => c.nivel === nivelActual + 1
  );

  if (!nextLevelConfig) {
    return {
      nivel: nivelActual,
      experienciaRequerida: experienciaActual,
      experienciaFaltante: 0,
    };
  }

  return {
    nivel: nextLevelConfig.nivel,
    experienciaRequerida: nextLevelConfig.experienciaRequerida,
    experienciaFaltante:
      nextLevelConfig.experienciaRequerida - experienciaActual,
  };
}

/**
 * Actualiza la racha de un inquilino
 */
export async function updateStreak(tenantId: string): Promise<number> {
  const prisma = await getPrisma();
  // Por ahora simplificado
  // En producción, verificar actividad diaria
  return 0;
}

/**
 * Calcula el ranking del inquilino
 */
export async function calculateRanking(tenantId: string): Promise<{
  const prisma = await getPrisma();
  edificio?: number;
  ciudad?: number;
  global?: number;
}> {
  // Obtener reputación del inquilino
  const reputation = await prisma.tenantReputation.findUnique({
    where: { tenantId },
  });

  if (!reputation) return {};

  // Ranking global
  const globalRank = await prisma.tenantReputation.count({
    where: {
      puntos: {
        gt: reputation.puntos,
      },
    },
  });

  return {
    global: globalRank + 1,
  };
}

/**
 * Eventos automáticos de puntos
 */
export async function onPaymentCompleted(
  tenantId: string,
  isOnTime: boolean,
  isEarly: boolean
) {
  if (isOnTime) {
    await addPoints(
      tenantId,
      'pago_puntual',
      100,
      'Pago de renta puntual'
    );
  }

  if (isEarly) {
    await addPoints(
      tenantId,
      'pago_anticipado',
      50,
      'Pago anticipado (>5 días)'
    );
  }
}

export async function onCleaningCompleted(tenantId: string) {
  await addPoints(
    tenantId,
    'limpieza',
    25,
    'Turno de limpieza completado'
  );
}

export async function onRecyclingDone(tenantId: string) {
  await addPoints(tenantId, 'reciclaje', 10, 'Reciclaje correcto');
}

export async function onReferralCompleted(tenantId: string) {
  await addPoints(tenantId, 'referido', 500, 'Nuevo inquilino referido');
}

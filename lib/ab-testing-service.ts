/**
 * Servicio de A/B Testing
 * 
 * Framework para testing de features, UI variants, pricing models.
 * 
 * @module ABTestingService
 */

import { prisma } from './db';
import logger from './logger';
import { redis } from './redis';

// ============================================================================
// TIPOS
// ============================================================================

export type VariantType = 'A' | 'B' | 'C' | 'D';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  variants: ABTestVariant[];
  targetPercentage: number; // % usuarios a incluir
  createdBy: string;
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: VariantType;
  description: string;
  config: Record<string, any>; // Configuración del variant
  trafficAllocation: number; // % de tráfico (suma = 100)
}

export interface ABTestAssignment {
  id: string;
  testId: string;
  userId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ABTestEvent {
  id: string;
  testId: string;
  variantId: string;
  userId: string;
  eventType: string; // 'view', 'click', 'conversion', 'custom'
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// GESTIÓN DE TESTS
// ============================================================================

/**
 * Crea un nuevo A/B test
 */
export async function createABTest(data: {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  targetPercentage: number;
  variants: {
    name: VariantType;
    description: string;
    config: Record<string, any>;
    trafficAllocation: number;
  }[];
  createdBy: string;
}): Promise<ABTest> {
  // Validar que traffic allocation suma 100
  const totalAllocation = data.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
  if (totalAllocation !== 100) {
    throw new Error('Traffic allocation must sum to 100%');
  }

  const test = await prisma.aBTest.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'DRAFT',
      targetPercentage: data.targetPercentage,
      createdBy: data.createdBy,
      variants: {
        create: data.variants.map((v) => ({
          name: v.name,
          description: v.description,
          config: v.config,
          trafficAllocation: v.trafficAllocation,
        })),
      },
    },
    include: {
      variants: true,
    },
  });

  logger.info('✅ A/B Test created', { testId: test.id, name: test.name });

  return test as any;
}

/**
 * Activa un A/B test
 */
export async function activateABTest(testId: string): Promise<void> {
  await prisma.aBTest.update({
    where: { id: testId },
    data: { status: 'ACTIVE' },
  });

  // Invalidar cache
  await redis.del(`abtest:${testId}`);

  logger.info('✅ A/B Test activated', { testId });
}

/**
 * Pausa un A/B test
 */
export async function pauseABTest(testId: string): Promise<void> {
  await prisma.aBTest.update({
    where: { id: testId },
    data: { status: 'PAUSED' },
  });

  await redis.del(`abtest:${testId}`);

  logger.info('⏸️ A/B Test paused', { testId });
}

/**
 * Finaliza un A/B test
 */
export async function completeABTest(testId: string): Promise<void> {
  await prisma.aBTest.update({
    where: { id: testId },
    data: { status: 'COMPLETED' },
  });

  await redis.del(`abtest:${testId}`);

  logger.info('✅ A/B Test completed', { testId });
}

// ============================================================================
// ASIGNACIÓN DE VARIANTES
// ============================================================================

/**
 * Asigna un usuario a una variante del test
 * 
 * Algoritmo:
 * 1. Verificar si usuario ya está asignado (persistencia)
 * 2. Si no, determinar si entra en el test (targetPercentage)
 * 3. Asignar variante según traffic allocation
 */
export async function assignUserToTest(
  userId: string,
  testId: string
): Promise<{ variantId: string; variant: ABTestVariant } | null> {
  // 1. Check cache first
  const cacheKey = `abtest:assignment:${testId}:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const assignment = JSON.parse(cached);
    return assignment;
  }

  // 2. Check DB for existing assignment
  const existingAssignment = await prisma.aBTestAssignment.findUnique({
    where: {
      testId_userId: {
        testId,
        userId,
      },
    },
    include: {
      variant: true,
    },
  });

  if (existingAssignment) {
    const result = {
      variantId: existingAssignment.variantId,
      variant: existingAssignment.variant as any,
    };

    // Cache por 1 día
    await redis.setex(cacheKey, 86400, JSON.stringify(result));

    return result;
  }

  // 3. Get test
  const test = await getABTest(testId);
  if (!test || test.status !== 'ACTIVE') {
    return null;
  }

  // 4. Check if user should be included (targetPercentage)
  const userHash = hashUserId(userId);
  const userPercentile = userHash % 100;
  if (userPercentile >= test.targetPercentage) {
    // User not included in test
    return null;
  }

  // 5. Assign variant based on traffic allocation
  const variantPercentile = (userHash % 10000) / 100; // 0-100
  let cumulativeAllocation = 0;
  let selectedVariant: ABTestVariant | null = null;

  for (const variant of test.variants) {
    cumulativeAllocation += variant.trafficAllocation;
    if (variantPercentile < cumulativeAllocation) {
      selectedVariant = variant;
      break;
    }
  }

  if (!selectedVariant) {
    // Fallback to first variant (should not happen if allocations sum to 100)
    selectedVariant = test.variants[0];
  }

  // 6. Save assignment
  const assignment = await prisma.aBTestAssignment.create({
    data: {
      testId,
      userId,
      variantId: selectedVariant.id,
    },
  });

  const result = {
    variantId: selectedVariant.id,
    variant: selectedVariant,
  };

  // Cache
  await redis.setex(cacheKey, 86400, JSON.stringify(result));

  logger.info('👤 User assigned to A/B test', {
    userId,
    testId,
    variant: selectedVariant.name,
  });

  return result;
}

/**
 * Hash simple de userId para determinismo
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// TRACKING DE EVENTOS
// ============================================================================

/**
 * Registra un evento en un A/B test
 */
export async function trackABTestEvent(data: {
  testId: string;
  userId: string;
  eventType: 'view' | 'click' | 'conversion' | string;
  metadata?: Record<string, any>;
}): Promise<void> {
  // Get user's assignment
  const assignment = await assignUserToTest(data.userId, data.testId);
  if (!assignment) {
    // User not in test
    return;
  }

  // Track event
  await prisma.aBTestEvent.create({
    data: {
      testId: data.testId,
      variantId: assignment.variantId,
      userId: data.userId,
      eventType: data.eventType,
      metadata: data.metadata,
    },
  });

  // Increment counter in Redis
  const counterKey = `abtest:counter:${data.testId}:${assignment.variantId}:${data.eventType}`;
  await redis.incr(counterKey);

  logger.debug('📊 A/B test event tracked', {
    testId: data.testId,
    variant: assignment.variant.name,
    eventType: data.eventType,
  });
}

// ============================================================================
// ANÁLISIS DE RESULTADOS
// ============================================================================

/**
 * Obtiene métricas de un A/B test
 */
export async function getABTestMetrics(testId: string): Promise<{
  test: ABTest;
  variants: {
    variant: ABTestVariant;
    metrics: {
      users: number;
      views: number;
      clicks: number;
      conversions: number;
      ctr: number; // Click-through rate
      conversionRate: number;
    };
  }[];
  winner: {
    variantId: string;
    metric: string;
    confidence: number;
  } | null;
}> {
  const test = await getABTest(testId);
  if (!test) {
    throw new Error('Test not found');
  }

  const variantsMetrics = await Promise.all(
    test.variants.map(async (variant) => {
      // Count users assigned
      const users = await prisma.aBTestAssignment.count({
        where: {
          testId,
          variantId: variant.id,
        },
      });

      // Count events
      const views = await prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          eventType: 'view',
        },
      });

      const clicks = await prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          eventType: 'click',
        },
      });

      const conversions = await prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          eventType: 'conversion',
        },
      });

      const ctr = views > 0 ? (clicks / views) * 100 : 0;
      const conversionRate = users > 0 ? (conversions / users) * 100 : 0;

      return {
        variant,
        metrics: {
          users,
          views,
          clicks,
          conversions,
          ctr: Math.round(ctr * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
      };
    })
  );

  // Determinar ganador (variante con mayor conversion rate)
  let winner = null;
  if (variantsMetrics.length >= 2) {
    const sortedByConversion = [...variantsMetrics].sort(
      (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
    );

    const winnerVariant = sortedByConversion[0];
    const runnerUp = sortedByConversion[1];

    // Simple confidence check (real statistical testing would use chi-square or t-test)
    const minSampleSize = 100;
    if (winnerVariant.metrics.users >= minSampleSize) {
      const improvement = 
        ((winnerVariant.metrics.conversionRate - runnerUp.metrics.conversionRate) /
          runnerUp.metrics.conversionRate) *
        100;

      winner = {
        variantId: winnerVariant.variant.id,
        metric: 'conversionRate',
        confidence: Math.min(95, Math.round(improvement * 2)), // Simplified confidence
      };
    }
  }

  return {
    test,
    variants: variantsMetrics,
    winner,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

async function getABTest(testId: string): Promise<ABTest | null> {
  const cacheKey = `abtest:${testId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: {
      variants: true,
    },
  });

  if (test) {
    await redis.setex(cacheKey, 3600, JSON.stringify(test)); // Cache 1h
  }

  return test as any;
}

export default {
  createABTest,
  activateABTest,
  pauseABTest,
  completeABTest,
  assignUserToTest,
  trackABTestEvent,
  getABTestMetrics,
};

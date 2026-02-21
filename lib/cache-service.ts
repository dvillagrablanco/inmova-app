/**
 * Servicio de Caching Avanzado con Redis
 * 
 * Optimiza performance mediante caching inteligente de queries
 * y resultados de IA.
 * 
 * @module CacheService
 */

import { Redis } from '@upstash/redis';
import logger from './logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

let redis: Redis | null = null;

// Intentar conectar a Redis si está configurado
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// ============================================================================
// TIPOS
// ============================================================================

export interface CacheOptions {
  ttl?: number; // Time to live en segundos (default: 300 = 5 min)
  namespace?: string; // Prefijo para la key
  tags?: string[]; // Tags para invalidación selectiva
}

export type CacheKey = string | { [key: string]: any };

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera una cache key consistente desde cualquier input
 */
function generateCacheKey(key: CacheKey, namespace?: string): string {
  let keyString: string;

  if (typeof key === 'string') {
    keyString = key;
  } else {
    // Convertir objeto a string determinístico
    keyString = JSON.stringify(key, Object.keys(key).sort());
  }

  return namespace ? `${namespace}:${keyString}` : keyString;
}

/**
 * Verifica si Redis está disponible
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

// ============================================================================
// OPERACIONES BÁSICAS
// ============================================================================

/**
 * Obtiene un valor del cache
 */
export async function get<T = any>(
  key: CacheKey,
  options: CacheOptions = {}
): Promise<T | null> {
  if (!redis) return null;

  try {
    const cacheKey = generateCacheKey(key, options.namespace);
    const value = await redis.get(cacheKey);

    if (value) {
      logger.debug('🎯 Cache HIT', { key: cacheKey });
      return value as T;
    }

    logger.debug('❌ Cache MISS', { key: cacheKey });
    return null;

  } catch (error: any) {
    logger.warn('⚠️ Cache get error:', error);
    return null;
  }
}

/**
 * Guarda un valor en el cache
 */
export async function set<T = any>(
  key: CacheKey,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!redis) return false;

  try {
    const cacheKey = generateCacheKey(key, options.namespace);
    const ttl = options.ttl || 300; // Default 5 minutos

    if (options.tags && options.tags.length > 0) {
      // Guardar tags para invalidación
      await Promise.all([
        redis.setex(cacheKey, ttl, JSON.stringify(value)),
        ...options.tags.map((tag) =>
          redis.sadd(`tag:${tag}`, cacheKey)
        ),
      ]);
    } else {
      await redis.setex(cacheKey, ttl, JSON.stringify(value));
    }

    logger.debug('💾 Cache SET', { key: cacheKey, ttl });
    return true;

  } catch (error: any) {
    logger.warn('⚠️ Cache set error:', error);
    return false;
  }
}

/**
 * Elimina un valor del cache
 */
export async function del(
  key: CacheKey,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!redis) return false;

  try {
    const cacheKey = generateCacheKey(key, options.namespace);
    await redis.del(cacheKey);

    logger.debug('🗑️ Cache DEL', { key: cacheKey });
    return true;

  } catch (error: any) {
    logger.warn('⚠️ Cache del error:', error);
    return false;
  }
}

/**
 * Invalida todas las keys con un tag específico
 */
export async function invalidateByTag(tag: string): Promise<number> {
  if (!redis) return 0;

  try {
    // Obtener todas las keys con este tag
    const keys = await redis.smembers(`tag:${tag}`);
    
    if (keys.length === 0) return 0;

    // Eliminar keys
    await redis.del(...keys);

    // Eliminar el set de tags
    await redis.del(`tag:${tag}`);

    logger.info(`🗑️ Cache invalidated by tag: ${tag}`, { count: keys.length });
    return keys.length;

  } catch (error: any) {
    logger.warn('⚠️ Cache invalidate by tag error:', error);
    return 0;
  }
}

/**
 * Limpia todo el cache (usar con precaución)
 */
export async function flush(): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.flushdb();
    logger.warn('🗑️ Cache FLUSHED (all keys deleted)');
    return true;

  } catch (error: any) {
    logger.error('❌ Cache flush error:', error);
    return false;
  }
}

// ============================================================================
// PATRONES AVANZADOS
// ============================================================================

/**
 * Cache-aside pattern: obtener o computar
 */
export async function getOrCompute<T = any>(
  key: CacheKey,
  computeFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Intentar obtener del cache
  const cached = await get<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Si no está en cache, computar
  const value = await computeFn();

  // Guardar en cache (no esperar)
  set(key, value, options).catch((err) => {
    logger.warn('Failed to cache computed value:', err);
  });

  return value;
}

/**
 * Cache con retry automático si falla
 */
export async function getWithRetry<T = any>(
  key: CacheKey,
  options: CacheOptions & { retries?: number } = {}
): Promise<T | null> {
  const maxRetries = options.retries || 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await get<T>(key, options);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        logger.error(`Cache get failed after ${maxRetries} retries`);
        return null;
      }
      // Esperar antes de reintentar (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }

  return null;
}

/**
 * Batch get: obtener múltiples valores a la vez
 */
export async function mget<T = any>(
  keys: CacheKey[],
  options: CacheOptions = {}
): Promise<(T | null)[]> {
  if (!redis) return keys.map(() => null);

  try {
    const cacheKeys = keys.map((k) => generateCacheKey(k, options.namespace));
    const values = await redis.mget(...cacheKeys);

    return values.map((v) => (v ? (v as T) : null));

  } catch (error: any) {
    logger.warn('⚠️ Cache mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Incrementa un contador
 */
export async function increment(
  key: CacheKey,
  options: CacheOptions = {}
): Promise<number> {
  if (!redis) return 0;

  try {
    const cacheKey = generateCacheKey(key, options.namespace);
    const newValue = await redis.incr(cacheKey);

    // Setear TTL si se especifica
    if (options.ttl) {
      await redis.expire(cacheKey, options.ttl);
    }

    return newValue;

  } catch (error: any) {
    logger.warn('⚠️ Cache increment error:', error);
    return 0;
  }
}

// ============================================================================
// CACHING ESPECÍFICO DE INMOVA
// ============================================================================

/**
 * Cache para resultados de valoraciones de IA
 */
export async function cachePropertyValuation(
  propertyId: string,
  valuation: any,
  ttl: number = 24 * 60 * 60 // 24 horas
): Promise<boolean> {
  return set(
    { type: 'valuation', propertyId },
    valuation,
    {
      ttl,
      namespace: 'ai',
      tags: ['valuations', `property:${propertyId}`],
    }
  );
}

/**
 * Obtiene valoración cacheada
 */
export async function getCachedPropertyValuation(
  propertyId: string
): Promise<any | null> {
  return get(
    { type: 'valuation', propertyId },
    { namespace: 'ai' }
  );
}

/**
 * Cache para matches de inquilinos
 */
export async function cacheTenantMatches(
  tenantId: string,
  matches: any[],
  ttl: number = 7 * 24 * 60 * 60 // 7 días
): Promise<boolean> {
  return set(
    { type: 'matches', tenantId },
    matches,
    {
      ttl,
      namespace: 'matching',
      tags: ['matches', `tenant:${tenantId}`],
    }
  );
}

/**
 * Obtiene matches cacheados
 */
export async function getCachedTenantMatches(
  tenantId: string
): Promise<any[] | null> {
  return get(
    { type: 'matches', tenantId },
    { namespace: 'matching' }
  );
}

/**
 * Invalida cache cuando una propiedad se actualiza
 */
export async function invalidatePropertyCache(propertyId: string): Promise<void> {
  await Promise.all([
    invalidateByTag(`property:${propertyId}`),
    del({ type: 'properties', filter: 'list' }, { namespace: 'api' }),
  ]);
}

/**
 * Invalida cache cuando un inquilino se actualiza
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await Promise.all([
    invalidateByTag(`tenant:${tenantId}`),
    del({ type: 'tenants', filter: 'list' }, { namespace: 'api' }),
  ]);
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtiene estadísticas de uso del cache
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  keysCount?: number;
  memoryUsage?: string;
  hitRate?: number;
} | null> {
  if (!redis) {
    return { available: false };
  }

  try {
    // Obtener info de Redis
    const info = await redis.info();
    
    // Parsear info (simplificado, Redis info es texto)
    const keysMatch = info.match(/keys=(\d+)/);
    const keysCount = keysMatch ? parseInt(keysMatch[1]) : undefined;

    return {
      available: true,
      keysCount,
      // Otros stats si se necesitan
    };

  } catch (error: any) {
    logger.error('❌ Failed to get cache stats:', error);
    return null;
  }
}

export default {
  get,
  set,
  del,
  invalidateByTag,
  flush,
  getOrCompute,
  getWithRetry,
  mget,
  increment,
  isRedisAvailable,
  cachePropertyValuation,
  getCachedPropertyValuation,
  cacheTenantMatches,
  getCachedTenantMatches,
  invalidatePropertyCache,
  invalidateTenantCache,
  getCacheStats,
};

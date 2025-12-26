/**
 * Cache Helper Functions
 * Wrapper para operaciones de caché con Redis
 */
import { getRedisClient } from './redis';
import logger from './logger';

/**
 * Cache key prefix para evitar colisiones
 */
const CACHE_PREFIX = 'inmova:';

/**
 * TTL por defecto (5 minutos)
 */
const DEFAULT_TTL = 300; // seconds

/**
 * Generate cache key with prefix
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * Get value from cache
 * @param key Cache key
 * @returns Parsed value or null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cacheKey = getCacheKey(key);
    const value = await redis.get(cacheKey);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('[Cache] Error getting key:', { key, error });
    return null;
  }
}

/**
 * Set value in cache
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const cacheKey = getCacheKey(key);
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await redis.setex(cacheKey, ttl, serialized);
    } else {
      await redis.set(cacheKey, serialized);
    }

    return true;
  } catch (error) {
    logger.error('[Cache] Error setting key:', { key, error });
    return false;
  }
}

/**
 * Delete value from cache
 * @param key Cache key or pattern
 */
export async function cacheDel(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const cacheKey = getCacheKey(key);
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    logger.error('[Cache] Error deleting key:', { key, error });
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 * @param pattern Pattern to match (e.g., 'buildings:*')
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    const cachePattern = getCacheKey(pattern);
    const keys = await redis.keys(cachePattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    logger.error('[Cache] Error deleting pattern:', { pattern, error });
    return 0;
  }
}

/**
 * Get or set value (cache-aside pattern)
 * Si el valor existe en caché, lo retorna
 * Si no existe, ejecuta la función, guarda en caché y retorna
 *
 * @param key Cache key
 * @param fn Function to execute if cache miss
 * @param ttl Time to live in seconds
 * @returns Cached or fetched value
 */
export async function cacheGetOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    logger.debug('[Cache] HIT:', key);
    return cached;
  }

  logger.debug('[Cache] MISS:', key);

  // Cache miss, execute function
  const value = await fn();

  // Store in cache (fire and forget)
  cacheSet(key, value, ttl).catch((error) => {
    logger.error('[Cache] Error storing value:', { key, error });
  });

  return value;
}

/**
 * Invalidate cache for a specific company
 * Elimina todas las keys relacionadas con una compañía
 */
export async function invalidateCompanyCache(companyId: string): Promise<number> {
  const deletedKeys = await cacheDelPattern(`company:${companyId}:*`);
  logger.info('[Cache] Invalidated company cache:', { companyId, deletedKeys });
  return deletedKeys;
}

/**
 * Invalidate cache for a specific user
 * Elimina todas las keys relacionadas con un usuario
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  const deletedKeys = await cacheDelPattern(`user:${userId}:*`);
  logger.info('[Cache] Invalidated user cache:', { userId, deletedKeys });
  return deletedKeys;
}

/**
 * Clear all cache
 * USAR CON CUIDADO - elimina TODO el caché
 */
export async function cacheClear(): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.flushdb();
    logger.warn('[Cache] ALL cache cleared');
    return true;
  } catch (error) {
    logger.error('[Cache] Error clearing cache:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const redis = getRedisClient();
  if (!redis) {
    return {
      connected: false,
      keys: 0,
      memory: 0,
      hitRate: 0,
    };
  }

  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    const dbSize = await redis.dbsize();

    // Parse info strings
    const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
    const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
    const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

    const usedMemory = parseInt(memory.match(/used_memory:(\d+)/)?.[1] || '0');

    return {
      connected: true,
      keys: dbSize,
      memory: usedMemory,
      hitRate: Math.round(hitRate * 100) / 100,
      hits,
      misses,
    };
  } catch (error) {
    logger.error('[Cache] Error getting stats:', error);
    return {
      connected: false,
      keys: 0,
      memory: 0,
      hitRate: 0,
    };
  }
}

/**
 * Cache TTL presets
 */
export const CacheTTL = {
  /** 1 minuto - para datos muy volátiles */
  VERY_SHORT: 60,
  /** 5 minutos - default */
  SHORT: 300,
  /** 15 minutos - para datos semi-estáticos */
  MEDIUM: 900,
  /** 1 hora - para datos estáticos */
  LONG: 3600,
  /** 24 horas - para datos muy estáticos */
  VERY_LONG: 86400,
  /** 7 días - para configuraciones */
  WEEK: 604800,
} as const;

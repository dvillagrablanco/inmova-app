/**
 * Redis Client Configuration
 * Singleton pattern para conexión Redis
 */
import Redis from 'ioredis';

import logger from '@/lib/logger';
let redisClient: Redis | null = null;

const CACHE_PREFIX = 'inmova:cache:';

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  VERY_LONG: 3600,
  DAY: 86400,
};

/**
 * Get or create Redis client
 * Usa singleton pattern para evitar múltiples conexiones
 */
export function getRedisClient(): Redis | null {
  // Si Redis no está configurado, retornar null (modo fallback sin caché)
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log('[Redis] No configurado - funcionando sin caché');
    return null;
  }

  // Si ya existe la conexión, retornarla
  if (redisClient) {
    return redisClient;
  }

  try {
    // Crear nueva conexión
    redisClient = new Redis(
      process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableOfflineQueue: false,
        lazyConnect: true,
      }
    );

    // Event listeners para debugging
    redisClient.on('connect', () => {
      console.log('[Redis] Conectado exitosamente');
    });

    redisClient.on('error', (error) => {
      logger.error('[Redis] Error:', error);
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Listo para usar');
    });

    // Conectar
    redisClient.connect().catch((error) => {
      logger.error('[Redis] Error al conectar:', error);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.error('[Redis] Error al inicializar:', error);
    return null;
  }
}

export async function initRedis(): Promise<Redis | null> {
  return getRedisClient();
}

export async function closeRedis(): Promise<void> {
  await closeRedisClient();
}

/**
 * Close Redis connection
 * Usar en cleanup/shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Conexión cerrada');
  }
}

/**
 * Get Redis client instance
 * Export como 'redis' para compatibilidad con código existente
 */
export const redis = getRedisClient();

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

export function companyKey(companyId: string, resource: string): string {
  return `company:${companyId}:${resource}`;
}

export async function getCached<T>(
  key: string,
  fetcher?: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T | null> {
  if (redis) {
    try {
      const value = await redis.get(cacheKey(key));
      if (value !== null) {
        return JSON.parse(value) as T;
      }
    } catch (error) {
      logger.error('[Redis] Error al obtener cache:', error);
    }
  }

  if (fetcher) {
    const data = await fetcher();
    await setCached(key, data, ttlSeconds);
    return data;
  }

  return null;
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.setex(cacheKey(key), ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('[Redis] Error al guardar cache:', error);
    return false;
  }
}

export async function deleteCached(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const result = await redis.del(cacheKey(key));
    return result > 0;
  } catch (error) {
    logger.error('[Redis] Error al eliminar cache:', error);
    return false;
  }
}

export async function existsCached(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const result = await redis.exists(cacheKey(key));
    return result > 0;
  } catch (error) {
    logger.error('[Redis] Error al verificar cache:', error);
    return false;
  }
}

export async function invalidateCache(pattern: string): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const fullPattern = cacheKey(pattern);
    const keys = pattern.includes('*') ? await redis.keys(fullPattern) : [fullPattern];
    if (keys.length === 0) {
      return 0;
    }
    return await redis.del(...keys);
  } catch (error) {
    logger.error('[Redis] Error al invalidar cache:', error);
    return 0;
  }
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return getCached(key, fetcher, ttlSeconds) as Promise<T>;
}

/**
 * Get Redis client (alias)
 */
export default getRedisClient;

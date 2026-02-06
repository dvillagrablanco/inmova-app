/**
 * Redis Client Configuration
 * Singleton pattern para conexión Redis
 */
import Redis from 'ioredis';

import logger from '@/lib/logger';

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'test' ||
  typeof window !== 'undefined';

let redisClient: Redis | null = null;
let warnedMissingConfig = false;
let warnedConnectError = false;
let warnedInitError = false;

/**
 * Get or create Redis client
 * Usa singleton pattern para evitar múltiples conexiones
 */
export function getRedisClient(): Redis | null {
  if (isBuildTime) {
    return null;
  }
  // Si Redis no está configurado, retornar null (modo fallback sin caché)
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    if (!warnedMissingConfig) {
      logger.info('[Redis] No configurado - funcionando sin caché');
      warnedMissingConfig = true;
    }
    return null;
  }

  // Si ya existe la conexión, retornarla
  if (redisClient) {
    return redisClient;
  }

  try {
    // Crear nueva conexión
    redisClient = new Redis(process.env.REDIS_URL || {
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
    });

    // Event listeners para debugging
    redisClient.on('connect', () => {
      logger.info('[Redis] Conectado exitosamente');
    });

    redisClient.on('error', (error) => {
      if (!warnedConnectError) {
        logger.warn('[Redis] Error:', error);
        warnedConnectError = true;
      }
    });

    redisClient.on('ready', () => {
      logger.info('[Redis] Listo para usar');
    });

    // Conectar
    redisClient.connect().catch((error) => {
      if (!warnedConnectError) {
        logger.warn('[Redis] Error al conectar:', error);
        warnedConnectError = true;
      }
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    if (!warnedInitError) {
      logger.warn('[Redis] Error al inicializar:', error);
      warnedInitError = true;
    }
    return null;
  }
}

/**
 * Close Redis connection
 * Usar en cleanup/shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('[Redis] Conexión cerrada');
  }
}

/**
 * Get Redis client instance
 * Export como 'redis' para compatibilidad con código existente
 */
export const redis = getRedisClient();

/**
 * Get Redis client (alias)
 */
export default getRedisClient;

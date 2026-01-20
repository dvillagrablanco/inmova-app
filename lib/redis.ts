/**
 * Redis Client Configuration
 * Singleton pattern para conexión Redis
 */
import Redis from 'ioredis';

import logger from '@/lib/logger';
let redisClient: Redis | null = null;

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

/**
 * Get Redis client (alias)
 */
export default getRedisClient;

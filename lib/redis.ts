/**
 * Redis Client Configuration
 * Singleton pattern para conexión Redis
 */
import Redis from 'ioredis';

let redis: Redis | null = null;

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
  if (redis) {
    return redis;
  }

  try {
    // Crear nueva conexión
    redis = new Redis(
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
    redis.on('connect', () => {
      console.log('[Redis] Conectado exitosamente');
    });

    redis.on('error', (error) => {
      console.error('[Redis] Error:', error);
    });

    redis.on('ready', () => {
      console.log('[Redis] Listo para usar');
    });

    // Conectar
    redis.connect().catch((error) => {
      console.error('[Redis] Error al conectar:', error);
      redis = null;
    });

    return redis;
  } catch (error) {
    console.error('[Redis] Error al inicializar:', error);
    return null;
  }
}

/**
 * Close Redis connection
 * Usar en cleanup/shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Conexión cerrada');
  }
}

/**
 * Get Redis client (alias)
 */
export default getRedisClient;

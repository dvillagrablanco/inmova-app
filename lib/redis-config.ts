/**
 * Configuración de Redis para caching distribuido
 * Soporta conexión a Redis Cloud, local, o fallback a in-memory
 */

import Redis from 'ioredis';
import logger from './logger';

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'test' ||
  typeof window !== 'undefined';

let redisClient: Redis | null = null;
let initialized = false;
let warnedMissingConfig = false;
let warnedError = false;
let warnedClose = false;

// Tipo para opciones de configuración
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number | void;
  maxRetriesPerRequest?: number;
  enableOfflineQueue?: boolean;
  tls?: any;
}

/**
 * Crea una instancia de Redis con configuración según el entorno
 */
function createRedisClient(): Redis | null {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    // Configuración base
    const config: RedisConfig = {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    let client: Redis;

    // Si es una URL completa de Redis Cloud o con formato redis://
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      const url = new URL(redisUrl);
      
      config.host = url.hostname;
      config.port = parseInt(url.port || '6379');
      
      if (url.password) {
        config.password = url.password;
      }

      if (url.protocol === 'rediss:') {
        config.tls = {
          rejectUnauthorized: false,
        };
      }

      client = new Redis(config);
    } else {
      // Formato simple: host:port
      const [host, port] = redisUrl.split(':');
      config.host = host;
      config.port = parseInt(port || '6379');
      
      if (process.env.REDIS_PASSWORD) {
        config.password = process.env.REDIS_PASSWORD;
      }

      client = new Redis(config);
    }

    // Event listeners
    client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      logger.info('✅ Redis ready to accept commands');
    });

    client.on('error', (err) => {
      if (!warnedError) {
        logger.warn('❌ Redis error:', err);
        warnedError = true;
      }
    });

    client.on('close', () => {
      if (!warnedClose) {
        logger.warn('⚠️  Redis connection closed');
        warnedClose = true;
      }
    });

    return client;
  } catch (error) {
    if (!warnedError) {
      logger.warn('❌ Failed to create Redis client:', error);
      warnedError = true;
    }
    return null;
  }
}

/**
 * Devuelve instancia singleton de Redis (lazy)
 */
export function getRedisConfigClient(): Redis | null {
  if (isBuildTime) return null;
  if (initialized) return redisClient;
  initialized = true;

  if (!process.env.REDIS_URL) {
    if (!warnedMissingConfig) {
      logger.info('⚠️  REDIS_URL not configured - using in-memory cache fallback');
      warnedMissingConfig = true;
    }
    return null;
  }

  redisClient = createRedisClient();
  return redisClient;
}

// Instancia singleton de Redis (compatibilidad)
export const redis = getRedisConfigClient();

/**
 * Verifica si Redis está disponible y conectado
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisConfigClient();
  if (!client) return false;
  
  try {
    await client.ping();
    return true;
  } catch (error) {
    logger.warn('Redis ping failed:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de Redis
 */
export async function getRedisStats(): Promise<any> {
  const client = getRedisConfigClient();
  if (!client) return null;
  
  try {
    const info = await client.info('stats');
    const dbSize = await client.dbsize();
    
    return {
      connected: true,
      dbSize,
      info: info.split('\r\n').reduce((acc: any, line: string) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Failed to get Redis stats:', error);
    return null;
  }
}

export default redis;

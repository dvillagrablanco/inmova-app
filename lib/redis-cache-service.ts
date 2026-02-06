/**
 * Servicio de caché distribuido con Redis
 * Con fallback automático a caché in-memory si Redis no está disponible
 */

import { redis, isRedisAvailable } from './redis-config';
import logger from './logger';

// Tipo para las entradas de caché (in-memory fallback)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Configuración por defecto
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const CLEANUP_INTERVAL = 60 * 1000; // Limpieza cada 1 minuto
const REDIS_KEY_PREFIX = 'inmova:cache:';

/**
 * Clase principal del servicio de caché distribuido
 */
class RedisCacheService {
  private memoryCache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;
  private redisAvailable: boolean;
  private initialized: boolean;

  constructor() {
    this.memoryCache = new Map();
    this.cleanupInterval = null;
    this.redisAvailable = false;
    this.initialized = false;
  }

  /**
   * Inicializa el servicio y verifica disponibilidad de Redis
   */
  private async initialize(): Promise<void> {
    this.redisAvailable = await isRedisAvailable();
    
    if (!this.redisAvailable) {
      logger.warn('⚠️  Redis not available - using in-memory cache fallback');
      this.startMemoryCleanup();
    } else {
      logger.info('✅ Redis cache service initialized');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.initialize();
  }

  /**
   * Inicia el proceso de limpieza automática para caché in-memory
   */
  private startMemoryCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredMemory();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Limpia entradas expiradas del caché in-memory
   */
  private cleanExpiredMemory(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Memory cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Genera la clave completa con prefijo
   */
  private getKey(key: string): string {
    return `${REDIS_KEY_PREFIX}${key}`;
  }

  /**
   * Obtiene un valor del caché (Redis o memoria)
   */
  async get<T>(key: string): Promise<T | undefined> {
    await this.ensureInitialized();
    const fullKey = this.getKey(key);

    // Intentar Redis primero si está disponible
    if (this.redisAvailable && redis) {
      try {
        const value = await redis.get(fullKey);
        
        if (value) {
          logger.info(`✅ Redis cache hit for key: ${key}`);
          return JSON.parse(value) as T;
        }
        
        logger.info(`⚠️  Redis cache miss for key: ${key}`);
        return undefined;
      } catch (error) {
        logger.error(`❌ Redis get error for key ${key}:`, error);
        // Marcar Redis como no disponible temporalmente
        this.redisAvailable = false;
        // Continuar con fallback a memoria
      }
    }

    // Fallback a caché in-memory
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      logger.info(`Memory cache expired for key: ${key}`);
      return undefined;
    }

    logger.info(`Memory cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Almacena un valor en el caché (Redis o memoria)
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    await this.ensureInitialized();
    const fullKey = this.getKey(key);

    // Intentar Redis primero si está disponible
    if (this.redisAvailable && redis) {
      try {
        const serialized = JSON.stringify(data);
        const ttlSeconds = Math.ceil(ttl / 1000);
        
        await redis.setex(fullKey, ttlSeconds, serialized);
        logger.info(`✅ Redis cache set for key: ${key} (TTL: ${ttl}ms)`);
        return;
      } catch (error) {
        logger.error(`❌ Redis set error for key ${key}:`, error);
        // Marcar Redis como no disponible temporalmente
        this.redisAvailable = false;
        // Continuar con fallback a memoria
      }
    }

    // Fallback a caché in-memory
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    logger.info(`Memory cache set for key: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Elimina una entrada específica del caché
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();
    const fullKey = this.getKey(key);
    let deleted = false;

    // Eliminar de Redis si está disponible
    if (this.redisAvailable && redis) {
      try {
        const result = await redis.del(fullKey);
        deleted = result > 0;
        if (deleted) {
          logger.info(`✅ Redis cache deleted for key: ${key}`);
        }
      } catch (error) {
        logger.error(`❌ Redis delete error for key ${key}:`, error);
        this.redisAvailable = false;
      }
    }

    // También eliminar de memoria (por si acaso)
    const memDeleted = this.memoryCache.delete(key);
    if (memDeleted) {
      logger.info(`Memory cache deleted for key: ${key}`);
    }

    return deleted || memDeleted;
  }

  /**
   * Invalida múltiples entradas que coincidan con un patrón
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    await this.ensureInitialized();
    let invalidated = 0;

    // Redis: usar SCAN para encontrar claves
    if (this.redisAvailable && redis) {
      try {
        const fullPattern = `${REDIS_KEY_PREFIX}*${pattern}*`;
        const stream = redis.scanStream({
          match: fullPattern,
          count: 100,
        });

        const keys: string[] = [];
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });

        await new Promise<void>((resolve, reject) => {
          stream.on('end', resolve);
          stream.on('error', reject);
        });

        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          invalidated = deleted;
          logger.info(`✅ Redis invalidated ${deleted} entries matching pattern: ${pattern}`);
        }
      } catch (error) {
        logger.error(`❌ Redis pattern invalidation error for pattern ${pattern}:`, error);
        this.redisAvailable = false;
      }
    }

    // También limpiar de memoria
    let memInvalidated = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        memInvalidated++;
      }
    }

    if (memInvalidated > 0) {
      logger.info(`Memory cache invalidated ${memInvalidated} entries matching pattern: ${pattern}`);
    }

    return invalidated + memInvalidated;
  }

  /**
   * Limpia todo el caché
   */
  async clear(): Promise<void> {
    // Limpiar Redis
    if (this.redisAvailable && redis) {
      try {
        const pattern = `${REDIS_KEY_PREFIX}*`;
        const stream = redis.scanStream({
          match: pattern,
          count: 100,
        });

        const keys: string[] = [];
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });

        await new Promise<void>((resolve, reject) => {
          stream.on('end', resolve);
          stream.on('error', reject);
        });

        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info(`✅ Redis cache cleared: ${keys.length} entries removed`);
        }
      } catch (error) {
        logger.error('❌ Redis clear error:', error);
        this.redisAvailable = false;
      }
    }

    // Limpiar memoria
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    logger.info(`Memory cache cleared: ${size} entries removed`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getStats(): Promise<{ 
    redis: { available: boolean; size?: number }; 
    memory: { size: number; keys: string[] } 
  }> {
    const stats = {
      redis: {
        available: this.redisAvailable,
        size: undefined as number | undefined,
      },
      memory: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys()),
      },
    };

    // Obtener estadísticas de Redis
    if (this.redisAvailable && redis) {
      try {
        const pattern = `${REDIS_KEY_PREFIX}*`;
        const keys = await redis.keys(pattern);
        stats.redis.size = keys.length;
      } catch (error) {
        logger.error('Failed to get Redis stats:', error);
      }
    }

    return stats;
  }

  /**
   * Detiene el proceso de limpieza (útil para testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Fuerza verificación de disponibilidad de Redis
   */
  async checkRedisAvailability(): Promise<boolean> {
    this.redisAvailable = await isRedisAvailable();
    return this.redisAvailable;
  }
}

// Instancia singleton del servicio de caché distribuido
const redisCacheService = new RedisCacheService();

/**
 * Helper genérico para ejecutar funciones con caché distribuido
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = await redisCacheService.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Si no está en caché, obtener los datos
  const data = await fetcher();
  await redisCacheService.set(key, data, ttl);
  return data;
}

export { redisCacheService as cacheService };
export default redisCacheService;

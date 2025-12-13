/**
 * Redis Cache Configuration and Utilities
 * Provides caching layer for frequently accessed data to reduce database load
 */
import { createClient, RedisClientType } from 'redis';
import logger from './logger';

let redisClient: RedisClientType | null = null;
let isConnected = false;

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  DAY: 86400, // 24 hours
} as const;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<RedisClientType | null> {
  // Only enable Redis if URL is configured
  if (!process.env.REDIS_URL) {
    logger.info('Redis not configured (REDIS_URL not set). Caching disabled.');
    return null;
  }

  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      logger.info('Redis client disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    logger.info('Redis initialized successfully');
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    redisClient = null;
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient && isConnected ? redisClient : null;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && isConnected) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis connection closed');
  }
}

/**
 * Get cached data with fallback
 */
export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const client = getRedisClient();

  // If Redis is not available, use fallback directly
  if (!client) {
    return fallback();
  }

  try {
    // Try to get from cache
    const cached = await client.get(key);
    if (cached && typeof cached === 'string') {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(cached) as T;
    }

    // Cache miss - get fresh data
    logger.debug(`Cache MISS: ${key}`);
    const data = await fallback();

    // Store in cache (fire and forget)
    client.setEx(key, ttl, JSON.stringify(data)).catch((err) => {
      logger.error(`Failed to cache ${key}:`, err);
    });

    return data;
  } catch (error) {
    logger.error(`Redis error for key ${key}:`, error);
    // On error, fallback to direct data fetch
    return fallback();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    // If pattern contains *, use SCAN to delete multiple keys
    if (keyOrPattern.includes('*')) {
      const keys: string[] = [];
      for await (const foundKey of client.scanIterator({ MATCH: keyOrPattern, COUNT: 100 })) {
        if (typeof foundKey === 'string') {
          keys.push(foundKey);
        }
      }
      if (keys.length > 0) {
        await Promise.all(keys.map(k => client.del(k)));
        logger.info(`Invalidated ${keys.length} cache keys matching: ${keyOrPattern}`);
      }
    } else {
      await client.del(keyOrPattern);
      logger.info(`Invalidated cache key: ${keyOrPattern}`);
    }
  } catch (error) {
    logger.error(`Failed to invalidate cache ${keyOrPattern}:`, error);
  }
}

/**
 * Generate cache key for company-specific data
 */
export function companyKey(companyId: string, resource: string): string {
  return `company:${companyId}:${resource}`;
}

/**
 * Generate cache key for user-specific data
 */
export function userKey(userId: string, resource: string): string {
  return `user:${userId}:${resource}`;
}

/**
 * Generate cache key for dashboard stats
 */
export function dashboardKey(companyId: string): string {
  return companyKey(companyId, 'dashboard:stats');
}

/**
 * Generate cache key for analytics
 */
export function analyticsKey(companyId: string, period: string): string {
  return companyKey(companyId, `analytics:${period}`);
}

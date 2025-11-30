/**
 * Redis Cache Service
 * Provides caching functionality for improved performance
 */

import Redis from 'ioredis';
import logger from './logger';

// Redis client instance
let redis: Redis | null = null;

// Initialize Redis connection
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    logger.warn('Redis URL not configured, caching disabled');
    return null;
  }
  
  if (redis) {
    return redis;
  }
  
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        logger.error('Redis reconnect on error', { error: err.message });
        return true;
      },
    });
    
    redis.on('connect', () => {
      logger.info('Redis connected');
    });
    
    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });
    
    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
    
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error });
    return null;
  }
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

// Get value from cache
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  
  try {
    const cached = await client.get(key);
    if (!cached) return null;
    
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
}

// Set value in cache
export async function setCached(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  
  try {
    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error });
    return false;
  }
}

// Delete value from cache
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error });
    return false;
  }
}

// Delete multiple keys matching a pattern
export async function deletePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    
    await client.del(...keys);
    return keys.length;
  } catch (error) {
    logger.error('Cache delete pattern error', { pattern, error });
    return 0;
  }
}

// Check if key exists
export async function existsCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  
  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache exists error', { key, error });
    return false;
  }
}

// Increment counter (useful for rate limiting, analytics)
export async function incrementCounter(
  key: string,
  ttl?: number
): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;
  
  try {
    const value = await client.incr(key);
    if (ttl && value === 1) {
      await client.expire(key, ttl);
    }
    return value;
  } catch (error) {
    logger.error('Cache increment error', { key, error });
    return 0;
  }
}

// Cache wrapper function for easy use
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key);
  if (cached !== null) {
    logger.debug('Cache hit', { key });
    return cached;
  }
  
  // Fetch fresh data
  logger.debug('Cache miss', { key });
  const data = await fetcher();
  
  // Store in cache
  await setCached(key, data, ttl);
  
  return data;
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedisClient;

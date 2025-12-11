/**
 * Sistema de Caché para mejorar performance
 * Implementación con Redis (cuando esté disponible) o In-Memory
 */

// Cache implementation for INMOVA

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix?: string;
}

// In-Memory Cache (fallback cuando Redis no está disponible)
class InMemoryCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  // Cleanup expired entries
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Every minute
  }
}

class CacheService {
  private client: InMemoryCache;
  private defaultTTL: number = 300; // 5 minutes

  constructor() {
    this.client = new InMemoryCache();
    this.client.startCleanup();
    console.log('Cache initialized (In-Memory fallback)');
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      await this.client.set(key, value, ttl || this.defaultTTL);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    try {
      await this.client.flush();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Cache wrapper for functions
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, config?.ttl);
    return result;
  }

  /**
   * Generate cache key
   */
  key(parts: (string | number)[]): string {
    return parts.join(':');
  }
}

export const cache = new CacheService();

// Cache TTL presets
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

import { Redis } from '@upstash/redis';
import logger, { logError } from '@/lib/logger';

// Initialize Redis client
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
  message?: string;
}

/**
 * Rate limiter using sliding window algorithm with Redis
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private fallbackStore: Map<string, { count: number; resetTime: number }>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.fallbackStore = new Map();
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    // Use Redis if available, otherwise use in-memory fallback
    if (redis) {
      return this.checkLimitRedis(identifier);
    }
    return this.checkLimitFallback(identifier);
  }

  /**
   * Rate limiting using Redis
   */
  private async checkLimitRedis(identifier: string): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Remove old entries
      await redis!.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await redis!.zcard(key);

      if (count >= this.config.maxRequests) {
        // Get the oldest entry to calculate reset time
        const oldest = (await redis!.zrange(key, 0, 0, { withScores: true })) as Array<{
          score: number;
          member: string;
        }>;
        const resetTime =
          oldest.length > 0 ? oldest[0].score + this.config.windowMs : now + this.config.windowMs;

        return {
          success: false,
          remaining: 0,
          limit: this.config.maxRequests,
          reset: Math.ceil(resetTime / 1000),
          message: this.config.message || 'Too many requests',
        };
      }

      // Add current request
      await redis!.zadd(key, { score: now, member: `${now}-${Math.random()}` });

      // Set expiration
      await redis!.expire(key, Math.ceil(this.config.windowMs / 1000));

      return {
        success: true,
        remaining: this.config.maxRequests - (count + 1),
        limit: this.config.maxRequests,
        reset: Math.ceil((now + this.config.windowMs) / 1000),
      };
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      // Fallback to in-memory on Redis error
      return this.checkLimitFallback(identifier);
    }
  }

  /**
   * In-memory fallback rate limiting
   */
  private checkLimitFallback(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.fallbackStore.get(identifier);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanupFallbackStore();
    }

    if (!entry || now > entry.resetTime) {
      // New window
      this.fallbackStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        limit: this.config.maxRequests,
        reset: Math.ceil((now + this.config.windowMs) / 1000),
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        limit: this.config.maxRequests,
        reset: Math.ceil(entry.resetTime / 1000),
        message: this.config.message || 'Too many requests',
      };
    }

    // Increment count
    entry.count++;
    this.fallbackStore.set(identifier, entry);

    return {
      success: true,
      remaining: this.config.maxRequests - entry.count,
      limit: this.config.maxRequests,
      reset: Math.ceil(entry.resetTime / 1000),
    };
  }

  /**
   * Clean up expired entries from fallback store
   */
  private cleanupFallbackStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.fallbackStore.entries()) {
      if (now > entry.resetTime) {
        this.fallbackStore.delete(key);
      }
    }
  }
}

/**
 * Predefined rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict limit for authentication endpoints
  auth: new RateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  }),

  // Standard API limit
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'API rate limit exceeded. Please slow down.',
  }),

  // Stricter limit for expensive operations
  expensive: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again later.',
  }),

  // Generous limit for public endpoints
  public: new RateLimiter({
    maxRequests: 300,
    windowMs: 60 * 1000, // 1 minute
  }),
};

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get IP from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult): Headers {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString());
  }

  return headers;
}

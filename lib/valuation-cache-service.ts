/**
 * Valuation Cache Service - Caché de valoraciones con Redis
 * @module valuation-cache-service
 */

import { Redis } from '@upstash/redis';

import logger from '@/lib/logger';
// Cliente Redis (Upstash ya está configurado en el proyecto)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

interface CachedValuation {
  propertyId: string;
  estimatedValue: number;
  confidenceScore: number;
  investmentPotential: string;
  reasoning: string;
  keyFactors: string[];
  marketComparison: any;
  recommendations: any[];
  cachedAt: string;
  expiresAt: string;
}

export class ValuationCacheService {
  private static CACHE_PREFIX = 'valuation:';
  private static CACHE_TTL = 7 * 24 * 60 * 60; // 7 días en segundos

  /**
   * Obtiene una valoración cacheada
   * @param propertyId - ID de la propiedad
   * @returns Valoración cacheada o null
   */
  static async get(propertyId: string): Promise<CachedValuation | null> {
    if (!redis) {
      return null;
    }

    try {
      const key = `${this.CACHE_PREFIX}${propertyId}`;
      const cached = await redis.get(key);

      if (cached && typeof cached === 'object') {
        // Verificar si expiró
        const valuation = cached as CachedValuation;
        const expiry = new Date(valuation.expiresAt);
        
        if (expiry > new Date()) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Valuation cache HIT for property ${propertyId}`);
          }
          return valuation;
        } else {
          // Expirado, eliminar
          await redis.del(key);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🗑️ Valuation cache EXPIRED for property ${propertyId}`);
          }
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ Valuation cache MISS for property ${propertyId}`);
      }
      return null;
    } catch (error) {
      logger.error('❌ Valuation cache GET error:', error);
      return null;
    }
  }

  /**
   * Guarda una valoración en caché
   * @param propertyId - ID de la propiedad
   * @param valuation - Datos de la valoración
   * @param ttl - Tiempo de vida en segundos (default: 7 días)
   */
  static async set(
    propertyId: string,
    valuation: Omit<CachedValuation, 'cachedAt' | 'expiresAt'>,
    ttl: number = this.CACHE_TTL
  ): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const key = `${this.CACHE_PREFIX}${propertyId}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000);

      const cachedValuation: CachedValuation = {
        ...valuation,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await redis.setex(key, ttl, JSON.stringify(cachedValuation));
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ Valuation cached for property ${propertyId} (TTL: ${ttl}s)`);
      }
      return true;
    } catch (error) {
      logger.error('❌ Valuation cache SET error:', error);
      return false;
    }
  }

  /**
   * Invalida caché de una propiedad
   * @param propertyId - ID de la propiedad
   */
  static async invalidate(propertyId: string): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const key = `${this.CACHE_PREFIX}${propertyId}`;
      await redis.del(key);
      
      console.log(`🗑️ Valuation cache INVALIDATED for property ${propertyId}`);
      return true;
    } catch (error) {
      logger.error('❌ Valuation cache INVALIDATE error:', error);
      return false;
    }
  }

  /**
   * Obtiene el histórico de valoraciones de una propiedad (desde DB)
   */
  static async getHistory(propertyId: string, limit: number = 10): Promise<any[]> {
    // Implementado en el API route
    return [];
  }

  /**
   * Verifica si Redis está configurado y disponible
   */
  static isAvailable(): boolean {
    return !!redis;
  }
}

export default ValuationCacheService;

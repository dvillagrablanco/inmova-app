/**
 * Sistema de caché en memoria para optimizar consultas a la base de datos
 * Incluye TTL configurable, invalidación manual y logs para debugging
 */

import logger from './logger';

// Tipo para las entradas de caché
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Configuración por defecto
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const CLEANUP_INTERVAL = 60 * 1000; // Limpieza cada 1 minuto

/**
 * Clase principal del servicio de caché
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Inicia el proceso de limpieza automática de entradas expiradas
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Limpia todas las entradas expiradas
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Obtiene un valor del caché
   * @param key Clave del caché
   * @returns El valor almacenado o undefined si no existe o está expirado
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.info(`Cache expired for key: ${key}`);
      return undefined;
    }

    logger.info(`Cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Almacena un valor en el caché
   * @param key Clave del caché
   * @param data Datos a almacenar
   * @param ttl Tiempo de vida en milisegundos (opcional)
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    logger.info(`Cache set for key: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Elimina una entrada específica del caché
   * @param key Clave del caché
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.info(`Cache deleted for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalida múltiples entradas que coincidan con un patrón
   * @param pattern Patrón de búsqueda (puede ser un string parcial)
   */
  invalidateByPattern(pattern: string): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info(`Cache invalidated ${invalidated} entries matching pattern: ${pattern}`);
    }

    return invalidated;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared: ${size} entries removed`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
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
}

// Instancia singleton del servicio de caché
const cacheService = new CacheService();

/**
 * Helper genérico para ejecutar funciones con caché
 * @param key Clave del caché
 * @param fetcher Función que obtiene los datos
 * @param ttl Tiempo de vida en milisegundos (opcional)
 * @returns Los datos cacheados o recién obtenidos
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = cacheService.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Si no está en caché, obtener los datos
  const data = await fetcher();
  cacheService.set(key, data, ttl);
  return data;
}

export { cacheService };
export default cacheService;

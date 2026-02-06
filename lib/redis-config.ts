/**
 * Configuración de Redis para caching distribuido (wrapper único).
 */

import type Redis from 'ioredis';
import logger from './logger';
import { getRedisClient } from './redis';

/**
 * Devuelve la instancia singleton de Redis (compatibilidad).
 */
export function getRedisConfigClient(): Redis | null {
  return getRedisClient();
}

export const redis = getRedisConfigClient();

/**
 * Verifica si Redis está disponible y conectado.
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
 * Obtiene estadísticas de Redis.
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
    logger.warn('Failed to get Redis stats:', error);
    return null;
  }
}

export default redis;

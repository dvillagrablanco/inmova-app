/**
 * Cache Helper Functions
 * Provides easy-to-use caching functions for common data patterns
 */
import { getCached, invalidateCache, companyKey, CACHE_TTL } from './redis';
import logger from './logger';

/**
 * Cache wrapper for dashboard statistics
 */
export async function cachedDashboardStats<T>(
  companyId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, 'dashboard');
  return getCached(key, fetchFn, CACHE_TTL.SHORT);
}

/**
 * Cache wrapper for building list
 */
export async function cachedBuildings<T>(
  companyId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, 'buildings');
  return getCached(key, fetchFn, CACHE_TTL.MEDIUM);
}

/**
 * Cache wrapper for units list
 */
export async function cachedUnits<T>(
  companyId: string,
  buildingId: string | null,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = buildingId
    ? companyKey(companyId, `units:building:${buildingId}`)
    : companyKey(companyId, 'units');
  return getCached(key, fetchFn, CACHE_TTL.MEDIUM);
}

/**
 * Cache wrapper for tenants list
 */
export async function cachedTenants<T>(
  companyId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, 'tenants');
  return getCached(key, fetchFn, CACHE_TTL.MEDIUM);
}

/**
 * Cache wrapper for contracts list
 */
export async function cachedContracts<T>(
  companyId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, 'contracts');
  return getCached(key, fetchFn, CACHE_TTL.SHORT);
}

/**
 * Cache wrapper for payments list
 */
export async function cachedPayments<T>(
  companyId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, 'payments');
  return getCached(key, fetchFn, CACHE_TTL.SHORT);
}

/**
 * Cache wrapper for analytics data
 */
export async function cachedAnalytics<T>(
  companyId: string,
  period: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = companyKey(companyId, `analytics:${period}`);
  return getCached(key, fetchFn, CACHE_TTL.LONG);
}

/**
 * Invalidate all caches for a company
 */
export async function invalidateCompanyCache(companyId: string): Promise<void> {
  const pattern = `company:${companyId}:*`;
  await invalidateCache(pattern);
  logger.info(`Invalidated all cache for company: ${companyId}`);
}

/**
 * Invalidate specific resource cache for a company
 */
export async function invalidateResourceCache(
  companyId: string,
  resource: string
): Promise<void> {
  const key = companyKey(companyId, resource);
  await invalidateCache(key);
  logger.info(`Invalidated cache for ${resource} in company: ${companyId}`);
}

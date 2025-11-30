/**
 * Tests for Redis Cache Service
 */

import {
  getCached,
  setCached,
  deleteCached,
  existsCached,
  withCache,
  CACHE_TTL,
} from '@/lib/redis';

describe('Redis Cache Service', () => {
  it('should handle cache operations when Redis is unavailable', async () => {
    // When Redis is not configured, operations should gracefully fail
    const result = await getCached('test-key');
    expect(result).toBeNull();
    
    const setResult = await setCached('test-key', { data: 'test' });
    expect(setResult).toBe(false);
    
    const deleteResult = await deleteCached('test-key');
    expect(deleteResult).toBe(false);
    
    const existsResult = await existsCached('test-key');
    expect(existsResult).toBe(false);
  });
  
  it('should execute withCache fetcher when cache misses', async () => {
    const fetcher = jest.fn().mockResolvedValue({ data: 'fresh' });
    
    const result = await withCache('test-key', fetcher, CACHE_TTL.SHORT);
    
    expect(fetcher).toHaveBeenCalled();
    expect(result).toEqual({ data: 'fresh' });
  });
  
  it('should have correct TTL constants', () => {
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.MEDIUM).toBe(300);
    expect(CACHE_TTL.LONG).toBe(1800);
    expect(CACHE_TTL.VERY_LONG).toBe(3600);
    expect(CACHE_TTL.DAY).toBe(86400);
  });
});

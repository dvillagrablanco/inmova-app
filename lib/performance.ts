/**
 * Performance Monitoring and Optimization Utilities
 */
import logger from './logger';

/**
 * Measure execution time of async functions
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  warnThreshold: number = 1000
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (duration > warnThreshold) {
      logger.warn(`⚠️  Slow operation: ${name} took ${duration}ms`);
    } else {
      logger.debug(`✅ ${name} completed in ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`❌ ${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Batch multiple promises and execute in parallel with limit
 */
export async function batchPromises<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  batchSize: number = 5
): Promise<any[]> {
  const results: any[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Memoize expensive function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      logger.debug(`🎯 Memoize HIT: ${fn.name}`);
      return cache.get(key);
    }

    logger.debug(`🚫 Memoize MISS: ${fn.name}`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance timing for API routes
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = Date.now();
    this.marks = new Map();
  }

  mark(name: string): void {
    const elapsed = Date.now() - this.startTime;
    this.marks.set(name, elapsed);
    logger.debug(`📍 ${name}: ${elapsed}ms`);
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  getMarks(): Record<string, number> {
    return Object.fromEntries(this.marks);
  }

  logSummary(name: string, threshold: number = 500): void {
    const total = this.getElapsed();
    const marks = this.getMarks();

    if (total > threshold) {
      logger.warn(`⚠️  Slow API: ${name} took ${total}ms`, marks);
    } else {
      logger.info(`✅ ${name} completed in ${total}ms`);
    }
  }
}

/**
 * Bundle size checker - logs warnings for large imports
 */
export function checkBundleSize(moduleName: string, sizeKB: number): void {
  if (sizeKB > 100) {
    logger.warn(`📦 Large bundle: ${moduleName} is ${sizeKB}KB`);
  }
}

/**
 * Image optimization helper
 */
export function getOptimizedImageUrl(url: string, width?: number, quality: number = 75): string {
  if (!url) return '';

  // If it's a Next.js Image API URL, preserve it
  if (url.startsWith('/_next/image')) {
    return url;
  }

  // For external URLs, use Next.js Image API
  const params = new URLSearchParams();
  params.set('url', url);
  if (width) params.set('w', width.toString());
  params.set('q', quality.toString());

  return `/_next/image?${params.toString()}`;
}

/**
 * Check if code is running on server or client
 */
export const isServer = typeof window === 'undefined';
export const isClient = !isServer;

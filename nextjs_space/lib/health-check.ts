/**
 * Health Check Service
 * Provides endpoints for monitoring application health
 */

import { prisma } from './db';
import getRedisClient from './redis';
import logger from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down' | 'disabled';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// Check database connectivity
async function checkDatabase(): Promise<{
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    return { status: 'up', responseTime };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check Redis connectivity
async function checkRedis(): Promise<{
  status: 'up' | 'down' | 'disabled';
  responseTime?: number;
  error?: string;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return { status: 'disabled' };
  }
  
  const start = Date.now();
  try {
    await redis.ping();
    const responseTime = Date.now() - start;
    return { status: 'up', responseTime };
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check memory usage
function checkMemory(): {
  used: number;
  total: number;
  percentage: number;
} {
  const used = process.memoryUsage().heapUsed;
  const total = process.memoryUsage().heapTotal;
  const percentage = (used / total) * 100;
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round(percentage * 100) / 100,
  };
}

// Perform full health check
export async function performHealthCheck(): Promise<HealthStatus> {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);
  
  const memory = checkMemory();
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (database.status === 'down') {
    status = 'unhealthy';
  } else if (redis.status === 'down' || memory.percentage > 90) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database,
      redis,
      memory,
    },
  };
}

// Simple liveness check
export async function livenessCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Liveness check failed', { error });
    return false;
  }
}

// Readiness check
export async function readinessCheck(): Promise<boolean> {
  try {
    const health = await performHealthCheck();
    return health.status !== 'unhealthy';
  } catch (error) {
    logger.error('Readiness check failed', { error });
    return false;
  }
}

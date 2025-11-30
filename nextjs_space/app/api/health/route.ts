/**
 * Health Check API Endpoint
 * Provides detailed health status for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/health-check';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const health = await performHealthCheck();
    
    const statusCode = health.status === 'unhealthy' ? 503 : 200;
    
    logger.info('Health check performed', {
      status: health.status,
      databaseResponseTime: health.checks.database.responseTime,
      redisStatus: health.checks.redis.status,
      memoryUsage: health.checks.memory.percentage,
    });
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check error', { error });
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

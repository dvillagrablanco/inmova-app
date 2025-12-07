/**
 * Health Check Endpoint
 * Monitorea el estado de la aplicación y sus dependencias
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    memory: CheckResult;
    environment: CheckResult;
  };
  version?: string;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    return {
      status: responseTime < 1000 ? 'pass' : 'warn',
      responseTime,
      message: `Connected (${responseTime}ms)`,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'fail',
      message: 'Database connection failed',
    };
  }
}

function checkMemory(): CheckResult {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;

  return {
    status: usagePercent < 80 ? 'pass' : usagePercent < 90 ? 'warn' : 'fail',
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
  };
}

function checkEnvironment(): CheckResult {
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_URL'];
  const missing = requiredVars.filter((v) => !process.env[v]);

  return {
    status: missing.length === 0 ? 'pass' : 'fail',
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required env vars present',
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación opcional (sólo para endpoints internos)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isAuthenticated = authHeader === `Bearer ${cronSecret}`;

    // Ejecutar health checks
    const [database, memory, environment] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkEnvironment()),
    ]);

    // Determinar estado general
    const checks = { database, memory, environment };
    const hasFailure = Object.values(checks).some((c) => c.status === 'fail');
    const hasWarning = Object.values(checks).some((c) => c.status === 'warn');

    const health: HealthCheck = {
      status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
    };

    // Sólo mostrar detalles si está autenticado
    const response = isAuthenticated
      ? health
      : {
          status: health.status,
          timestamp: health.timestamp,
        };

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

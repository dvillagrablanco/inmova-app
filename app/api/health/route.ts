export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Force Node.js runtime

import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
export async function GET() {
  try {
    // Get basic system info (sin Prisma para evitar problemas)
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Verificar variables críticas
    const nextauthUrl = process.env.NEXTAUTH_URL;
    const databaseUrl = process.env.DATABASE_URL;

    // Intentar test de BD solo si está disponible
    let dbStatus = 'unknown';
    try {
      // Lazy load Prisma solo cuando sea necesario
      const { checkDbConnection } = await import('@/lib/db');
      const isConnected = await checkDbConnection();
      dbStatus = isConnected ? 'connected' : 'disconnected';
    } catch (dbError) {
      logger.warn('[Health Check] DB check skipped:', dbError);
      dbStatus = 'check-skipped';
    }

    // Verificar configuración crítica
    const hasNextAuth = !!nextauthUrl && nextauthUrl.length > 10;
    const hasDatabase = !!databaseUrl && databaseUrl.includes('postgresql');

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          rss: Math.floor(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        },
        checks: {
          database: dbStatus,
          nextauth: hasNextAuth ? 'configured' : 'missing',
          databaseConfig: hasDatabase ? 'configured' : 'missing',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    logger.error('[Health Check] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}

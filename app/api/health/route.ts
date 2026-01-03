export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Verificar NEXTAUTH_URL (CRÍTICO para login)
    const nextauthUrl = process.env.NEXTAUTH_URL;
    if (
      !nextauthUrl ||
      nextauthUrl === 'https://' ||
      nextauthUrl.length < 10 ||
      !nextauthUrl.startsWith('https://')
    ) {
      console.error('[Health Check] NEXTAUTH_URL mal configurado:', nextauthUrl);
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'unknown',
          error: 'NEXTAUTH_URL not properly configured',
          nextauthUrl: nextauthUrl || 'not set',
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

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get basic system info
    const dbConnection = 'connected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbConnection,
        uptime: Math.floor(uptime), // seconds
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          rss: Math.floor(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024), // MB
        },
        environment: process.env.NODE_ENV,
        // Incluir NEXTAUTH_URL en health check (para debugging)
        nextauthUrl: nextauthUrl,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[Health Check] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
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

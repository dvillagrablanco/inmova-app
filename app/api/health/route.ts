export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Intentar conectar a la BD de forma segura
    let dbConnection = 'unknown';
    try {
      // Solo intentar conectar si DATABASE_URL existe
      if (process.env.DATABASE_URL) {
        await prisma.$queryRaw`SELECT 1`;
        dbConnection = 'connected';
      } else {
        dbConnection = 'not_configured';
      }
    } catch (dbError) {
      console.error('[Health Check] DB Error:', dbError);
      dbConnection = 'disconnected';
    }

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
        database: 'error',
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Health Check Endpoint
 * 
 * Verifica:
 * - Estado general de la aplicación
 * - Conexión a base de datos
 * - Tiempo de respuesta
 * 
 * Usado por:
 * - UptimeRobot
 * - Load balancers
 * - Monitoring tools
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }
}

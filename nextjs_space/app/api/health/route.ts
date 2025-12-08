import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint para UptimeRobot y otros servicios de monitoring
 * 
 * Verifica:
 * - Servidor Next.js activo
 * - Conexión a base de datos
 * - Variables de entorno críticas
 * 
 * Responde con 200 si todo está OK, o 500 si hay algún problema
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; responseTime?: number }> = {};

  // 1. Check: Servidor Next.js (siempre OK si llega aquí)
  checks.server = { status: 'ok', message: 'Next.js server running' };

  // 2. Check: Base de datos
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      message: 'Database connection successful',
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }

  // 3. Check: Variables de entorno críticas
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length === 0) {
    checks.environment = {
      status: 'ok',
      message: 'All required environment variables are set'
    };
  } else {
    checks.environment = {
      status: 'error',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`
    };
  }

  // 4. Check: Servicios opcionales (solo reportar estado, no fallar)
  const optionalServices = {
    stripe: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'),
    sendgrid: !!process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('placeholder'),
    sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN.includes('placeholder'),
    s3: !!process.env.AWS_BUCKET_NAME
  };

  // Determinar estado global
  const hasErrors = Object.values(checks).some(check => check.status === 'error');
  const totalResponseTime = Date.now() - startTime;

  // Construir respuesta
  const response = {
    status: hasErrors ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: totalResponseTime,
    checks,
    services: optionalServices,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Log si hay errores
  if (hasErrors) {
    console.error('[HEALTH CHECK FAILED]', JSON.stringify(response, null, 2));
  }

  // Devolver respuesta con código apropiado
  return NextResponse.json(
    response,
    { status: hasErrors ? 500 : 200 }
  );
}

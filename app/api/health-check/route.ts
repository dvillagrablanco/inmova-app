/**
 * Endpoint de Health Check
 * Verifica el estado de servicios críticos
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    services: {},
  };

  try {
    // 1. Check Database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.services.database = {
        status: 'healthy',
        message: 'Database connection OK',
      };
    } catch (error: any) {
      checks.services.database = {
        status: 'unhealthy',
        message: error.message,
        error: error.code,
      };
    }

    // 2. Check Environment Variables
    checks.services.environment = {
      status: 'healthy',
      variables: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        DATABASE_URL_CONFIGURED: !!process.env.DATABASE_URL,
        NEXTAUTH_SECRET_CONFIGURED: !!process.env.NEXTAUTH_SECRET,
      },
    };

    // 3. Check Prisma Client
    try {
      // @ts-ignore
      const prismaVersion = prisma._engineConfig?.version || 'unknown';
      checks.services.prisma = {
        status: 'healthy',
        version: prismaVersion,
      };
    } catch (error: any) {
      checks.services.prisma = {
        status: 'unhealthy',
        message: error.message,
      };
    }

    // Determinar status general
    const allHealthy = Object.values(checks.services).every(
      (service: any) => service.status === 'healthy'
    );

    checks.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(checks, { status: allHealthy ? 200 : 503 });
  } catch (error: any) {
    checks.status = 'unhealthy';
    checks.error = error.message;
    return NextResponse.json(checks, { status: 500 });
  }
}

/**
 * API para verificar el estado de las integraciones de la plataforma
 * Solo accesible para super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface IntegrationStatus {
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  lastChecked: string;
  details?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const statuses: Record<string, IntegrationStatus> = {};

    // Verificar Stripe
    statuses.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar SMTP
    statuses.smtp = {
      status: process.env.SMTP_HOST && process.env.SMTP_USER ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar Twilio
    statuses.twilio = {
      status: process.env.TWILIO_ACCOUNT_SID ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar AWS S3
    statuses.aws_s3 = {
      status: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_BUCKET ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar PostgreSQL
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl && !dbUrl.includes('dummy-build-host')) {
        // Intentar una consulta simple
        const { prisma } = await import('@/lib/db');
        await prisma.$queryRaw`SELECT 1`;
        statuses.postgresql = {
          status: 'connected',
          lastChecked: new Date().toISOString(),
        };
      } else {
        statuses.postgresql = {
          status: 'not_configured',
          lastChecked: new Date().toISOString(),
          details: 'DATABASE_URL no configurada o es placeholder',
        };
      }
    } catch (error: any) {
      statuses.postgresql = {
        status: 'error',
        lastChecked: new Date().toISOString(),
        details: error.message,
      };
    }

    // Verificar Signaturit
    statuses.signaturit = {
      status: process.env.SIGNATURIT_API_KEY ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar Anthropic
    statuses.anthropic = {
      status: process.env.ANTHROPIC_API_KEY ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    // Verificar Sentry
    statuses.sentry = {
      status: process.env.SENTRY_DSN ? 'connected' : 'not_configured',
      lastChecked: new Date().toISOString(),
    };

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('Error verificando integraciones:', error);
    return NextResponse.json(
      { error: 'Error verificando integraciones' },
      { status: 500 }
    );
  }
}

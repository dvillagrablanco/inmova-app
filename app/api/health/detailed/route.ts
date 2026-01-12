export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Health Check Detallado
 * Requiere autenticación de admin
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Solo admins pueden ver el health check detallado
    if (!session || (session.user.role !== 'administrador' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Verificar todas las integraciones
    const checks = {
      // Core
      database: {
        configured: !!process.env.DATABASE_URL,
        status: 'unknown',
      },
      nextauth: {
        configured: !!process.env.NEXTAUTH_URL && !!process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL,
      },

      // Storage
      awsS3: {
        configured:
          !!process.env.AWS_ACCESS_KEY_ID &&
          !!process.env.AWS_SECRET_ACCESS_KEY &&
          !!process.env.AWS_BUCKET,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_BUCKET,
      },

      // Payments
      stripe: {
        configured:
          !!process.env.STRIPE_SECRET_KEY &&
          !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
        mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
      },

      // Email
      smtp: {
        configured:
          !!process.env.SMTP_HOST &&
          !!process.env.SMTP_USER &&
          !!process.env.SMTP_PASSWORD,
        host: process.env.SMTP_HOST,
        user: process.env.SMTP_USER,
      },

      // Digital Signature
      signaturit: {
        configured: !!process.env.SIGNATURIT_API_KEY,
        environment: process.env.SIGNATURIT_ENVIRONMENT || 'not-set',
      },
      docusign: {
        configured:
          !!process.env.DOCUSIGN_INTEGRATION_KEY &&
          !!process.env.DOCUSIGN_USER_ID &&
          !!process.env.DOCUSIGN_ACCOUNT_ID,
      },

      // SMS/WhatsApp
      twilio: {
        configured:
          !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
        hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      },

      // Analytics
      googleAnalytics: {
        configured: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      },

      // AI
      anthropic: {
        configured: !!process.env.ANTHROPIC_API_KEY,
      },

      // Monitoring
      sentry: {
        configured: !!process.env.SENTRY_DSN,
      },
    };

    // Test BD si está disponible
    try {
      const { checkDbConnection } = await import('@/lib/db');
      const isConnected = await checkDbConnection();
      checks.database.status = isConnected ? 'connected' : 'disconnected';
    } catch (error) {
      checks.database.status = 'error';
    }

    // Calcular estadísticas
    const totalIntegrations = Object.keys(checks).length;
    const configuredIntegrations = Object.values(checks).filter(
      (check: any) => check.configured === true
    ).length;
    const configurationPercentage = Math.round(
      (configuredIntegrations / totalIntegrations) * 100
    );

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        server: {
          uptime: Math.floor(uptime),
          uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
          memory: {
            rss: Math.floor(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
          },
          nodeVersion: process.version,
          platform: process.platform,
        },
        integrations: checks,
        summary: {
          total: totalIntegrations,
          configured: configuredIntegrations,
          missing: totalIntegrations - configuredIntegrations,
          percentage: configurationPercentage,
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
    console.error('[Detailed Health Check] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkAdminAccess } from '@/lib/admin-roles';
import logger from '@/lib/logger';
import { isRedisAvailable } from '@/lib/redis-config';
import { isTwilioConfigured } from '@/lib/sms-service';
import * as S3Service from '@/lib/aws-s3-service';
import { withRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CheckStatus = 'configured' | 'missing' | 'connected' | 'disconnected' | 'unavailable' | 'error';

function isConfigured(envVar: string | undefined): boolean {
  if (!envVar) return false;
  const val = envVar.toLowerCase();
  if (val.includes('placeholder') || val.includes('dummy') || val.includes('your_') || val.includes('change_me')) return false;
  if (envVar.length < 5) return false;
  return true;
}

function maskValue(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

const RATE_LIMIT = { interval: 60 * 1000, uniqueTokenPerInterval: 60 };

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const session = await getServerSession(authOptions);
      const { authorized, response } = checkAdminAccess(session, 'admin');
      if (!authorized) {
        return NextResponse.json(
          { error: response?.error || 'No autorizado' },
          { status: response?.status || 401 }
        );
      }

      // ── Real connection checks ──
      let dbStatus: CheckStatus = 'missing';
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        try {
          const { checkDbConnection } = await import('@/lib/db');
          const ok = await checkDbConnection();
          dbStatus = ok ? 'connected' : 'disconnected';
        } catch {
          dbStatus = 'error';
        }
      }

      let redisStatus: CheckStatus = 'missing';
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        try {
          const ok = await isRedisAvailable();
          redisStatus = ok ? 'connected' : 'unavailable';
        } catch {
          redisStatus = 'error';
        }
      }

      // ── Infrastructure ──
      const infraestructura = {
        postgresql: { status: dbStatus, configured: dbStatus !== 'missing' },
        redis: { status: redisStatus, configured: redisStatus !== 'missing' },
        aws_s3: {
          configured: S3Service.isS3Configured(),
          status: S3Service.isS3Configured() ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          region: process.env.AWS_REGION || '',
          bucket: process.env.AWS_BUCKET_NAME || '',
        },
        nextauth: {
          configured: isConfigured(process.env.NEXTAUTH_URL) && isConfigured(process.env.NEXTAUTH_SECRET),
          status: (isConfigured(process.env.NEXTAUTH_URL) && isConfigured(process.env.NEXTAUTH_SECRET)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
        },
      };

      // ── Pagos ──
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const stripeMode = stripeKey?.startsWith('sk_live') ? 'live' : stripeKey?.startsWith('sk_test') ? 'test' : 'no configurado';

      const pagos = {
        stripe: {
          configured: isConfigured(stripeKey),
          status: isConfigured(stripeKey) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          mode: stripeMode,
          masked: maskValue(stripeKey),
        },
        gocardless: {
          configured: isConfigured(process.env.GOCARDLESS_ACCESS_TOKEN),
          status: isConfigured(process.env.GOCARDLESS_ACCESS_TOKEN) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          mode: process.env.GOCARDLESS_ENVIRONMENT || 'sandbox',
        },
        bizum: {
          configured: isConfigured(process.env.BIZUM_MERCHANT_ID) && isConfigured(process.env.BIZUM_SECRET_KEY),
          status: (isConfigured(process.env.BIZUM_MERCHANT_ID)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          environment: process.env.BIZUM_ENVIRONMENT || 'sandbox',
        },
      };

      // ── Comunicación ──
      const comunicacion = {
        gmail_smtp: {
          configured: isConfigured(process.env.SMTP_HOST) && isConfigured(process.env.SMTP_USER),
          status: (isConfigured(process.env.SMTP_HOST) && isConfigured(process.env.SMTP_USER)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          host: process.env.SMTP_HOST || '',
          user: process.env.SMTP_USER || '',
        },
        twilio: {
          configured: isTwilioConfigured(),
          status: isTwilioConfigured() ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        },
        push_notifications: {
          configured: isConfigured(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && isConfigured(process.env.VAPID_PRIVATE_KEY),
          status: (isConfigured(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
        },
      };

      // ── IA ──
      const ia = {
        anthropic_claude: {
          configured: isConfigured(process.env.ANTHROPIC_API_KEY),
          status: isConfigured(process.env.ANTHROPIC_API_KEY) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        },
      };

      // ── Contabilidad ──
      const contabilidad = {
        contasimple: {
          configured: isConfigured(process.env.CONTASIMPLE_AUTH_KEY) || isConfigured(process.env.INMOVA_CONTASIMPLE_AUTH_KEY),
          status: (isConfigured(process.env.CONTASIMPLE_AUTH_KEY) || isConfigured(process.env.INMOVA_CONTASIMPLE_AUTH_KEY)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
        },
        zucchetti: {
          configured: isConfigured(process.env.ZUCCHETTI_API_URL) || isConfigured(process.env.ZUCCHETTI_CLIENT_ID),
          status: (isConfigured(process.env.ZUCCHETTI_API_URL) || isConfigured(process.env.ZUCCHETTI_CLIENT_ID)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
        },
      };

      // ── Firma Digital (Grupo Vidaro) ──
      const docusignFullyConfigured = !!(
        isConfigured(process.env.DOCUSIGN_INTEGRATION_KEY) &&
        isConfigured(process.env.DOCUSIGN_USER_ID) &&
        isConfigured(process.env.DOCUSIGN_ACCOUNT_ID) &&
        isConfigured(process.env.DOCUSIGN_PRIVATE_KEY)
      );
      const firma = {
        signaturit: {
          configured: isConfigured(process.env.SIGNATURIT_API_KEY),
          status: isConfigured(process.env.SIGNATURIT_API_KEY) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          environment: process.env.SIGNATURIT_ENVIRONMENT || 'sandbox',
        },
        docusign: {
          configured: docusignFullyConfigured,
          status: docusignFullyConfigured ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          environment: process.env.DOCUSIGN_BASE_PATH?.includes('demo') ? 'demo' : 'production',
          hasIntegrationKey: isConfigured(process.env.DOCUSIGN_INTEGRATION_KEY),
          hasUserId: isConfigured(process.env.DOCUSIGN_USER_ID),
          hasAccountId: isConfigured(process.env.DOCUSIGN_ACCOUNT_ID),
          hasPrivateKey: isConfigured(process.env.DOCUSIGN_PRIVATE_KEY),
        },
      };

      // ── Analytics & Monitoring ──
      const analytics = {
        google_analytics: {
          configured: isConfigured(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
          status: isConfigured(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
          measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
        },
        sentry: {
          configured: isConfigured(process.env.SENTRY_DSN) || isConfigured(process.env.NEXT_PUBLIC_SENTRY_DSN),
          status: (isConfigured(process.env.SENTRY_DSN) || isConfigured(process.env.NEXT_PUBLIC_SENTRY_DSN)) ? 'configured' as CheckStatus : 'missing' as CheckStatus,
        },
      };

      // ── Summary ──
      const allChecks = { ...infraestructura, ...pagos, ...comunicacion, ...ia, ...contabilidad, ...firma, ...analytics };
      const total = Object.keys(allChecks).length;
      const configured = Object.values(allChecks).filter(
        (c: any) => c.status === 'configured' || c.status === 'connected'
      ).length;

      return NextResponse.json({
        status: configured === total ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        infraestructura,
        pagos,
        comunicacion,
        ia,
        contabilidad,
        firma,
        analytics,
        resumen: {
          total,
          configured,
          percentage: Math.round((configured / total) * 100),
        },
      });
    } catch (error) {
      logger.error('[Integraciones Status] Error:', error);
      return NextResponse.json({ status: 'error', timestamp: new Date().toISOString() }, { status: 500 });
    }
  }, RATE_LIMIT);
}

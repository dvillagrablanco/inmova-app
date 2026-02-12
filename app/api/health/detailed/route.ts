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

const HEALTH_DETAILED_RATE_LIMIT = {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 60,
};

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions);
        const { authorized, response } = checkAdminAccess(session, 'admin');
        if (!authorized) {
          return NextResponse.json(
            { error: response?.error || 'No autorizado' },
            { status: response?.status || 401 }
          );
        }

        const nextauthUrl = process.env.NEXTAUTH_URL;
        const nextauthSecret = process.env.NEXTAUTH_SECRET;
        const databaseUrl = process.env.DATABASE_URL;

        let dbStatus: CheckStatus = databaseUrl ? 'disconnected' : 'missing';
        if (databaseUrl) {
          try {
            const { checkDbConnection } = await import('@/lib/db');
            const ok = await checkDbConnection();
            dbStatus = ok ? 'connected' : 'disconnected';
          } catch (error) {
            logger.warn('[Health Detailed] DB check error:', error);
            dbStatus = 'error';
          }
        }

        const redisConfigured = !!process.env.REDIS_URL || !!process.env.REDIS_HOST;
        let redisStatus: CheckStatus = redisConfigured ? 'unavailable' : 'missing';
        if (redisConfigured) {
          try {
            const ok = await isRedisAvailable();
            redisStatus = ok ? 'connected' : 'unavailable';
          } catch (error) {
            logger.warn('[Health Detailed] Redis check error:', error);
            redisStatus = 'error';
          }
        }

        const upstashConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
        const smtpConfigured =
          !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;
        const contasimpleConfigured = !!process.env.CONTASIMPLE_AUTH_KEY;
        const contasimpleInmovaConfigured = !!process.env.INMOVA_CONTASIMPLE_AUTH_KEY;

        const bankinterConfigured = [
          'REDSYS_API_URL',
          'REDSYS_CLIENT_ID',
          'REDSYS_CLIENT_SECRET',
          'REDSYS_CERTIFICATE_PATH',
          'REDSYS_CERTIFICATE_KEY_PATH',
        ].every((key) => !!process.env[key]);

        const checks = {
          database: {
            configured: !!databaseUrl,
            status: dbStatus,
          },
          nextauth: {
            configured: !!nextauthUrl && !!nextauthSecret,
            status: nextauthUrl && nextauthSecret ? 'configured' : 'missing',
          },
          redis: {
            configured: redisConfigured,
            status: redisStatus,
          },
          upstash: {
            configured: upstashConfigured,
            status: upstashConfigured ? 'configured' : 'missing',
          },
          s3: {
            configured: S3Service.isS3Configured(),
            status: S3Service.isS3Configured() ? 'configured' : 'missing',
          },
          smtp: {
            configured: smtpConfigured,
            status: smtpConfigured ? 'configured' : 'missing',
          },
          twilio: {
            configured: isTwilioConfigured(),
            status: isTwilioConfigured() ? 'configured' : 'missing',
          },
          abacus: {
            configured: !!process.env.ABACUSAI_API_KEY,
            status: process.env.ABACUSAI_API_KEY ? 'configured' : 'missing',
          },
          anthropic: {
            configured: !!process.env.ANTHROPIC_API_KEY,
            status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
          },
          bankinter: {
            configured: bankinterConfigured,
            status: bankinterConfigured ? 'configured' : 'missing',
          },
          contasimple: {
            configured: contasimpleConfigured,
            status: contasimpleConfigured ? 'configured' : 'missing',
          },
          contasimpleInmova: {
            configured: contasimpleInmovaConfigured,
            status: contasimpleInmovaConfigured ? 'configured' : 'missing',
          },
          plaid: {
            configured: !!process.env.PLAID_CLIENT_ID && !!process.env.PLAID_SECRET,
            status: (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) ? 'configured' : 'missing',
          },
        };

        const total = Object.keys(checks).length;
        const configured = Object.values(checks).filter((c) => c.status === 'configured' || c.status === 'connected')
          .length;
        const summary = {
          total,
          configured,
          percentConfigured: Math.round((configured / total) * 100),
        };

        return NextResponse.json({
          status: configured === total ? 'ok' : 'degraded',
          timestamp: new Date().toISOString(),
          checks,
          summary,
        });
      } catch (error) {
        logger.error('[Health Detailed] Error:', error);
        return NextResponse.json(
          {
            status: 'error',
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    },
    HEALTH_DETAILED_RATE_LIMIT
  );
}

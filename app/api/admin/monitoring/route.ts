/**
 * API: System monitoring metrics
 * GET /api/admin/monitoring
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Account lockout stats
    let lockoutStats = { totalTracked: 0, currentlyLocked: 0 };
    try {
      const { getLockoutStats } = await import('@/lib/account-lockout');
      lockoutStats = getLockoutStats();
    } catch {}

    // DB check
    let dbStatus = 'unknown';
    try {
      const { checkDbConnection } = await import('@/lib/db');
      dbStatus = (await checkDbConnection()) ? 'connected' : 'disconnected';
    } catch {
      dbStatus = 'error';
    }

    const metrics = {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: Math.round(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      database: {
        status: dbStatus,
      },
      security: {
        accountsTracked: lockoutStats.totalTracked,
        accountsLocked: lockoutStats.currentlyLocked,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthConfigured: !!process.env.NEXTAUTH_SECRET,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
        smtpConfigured: !!process.env.SMTP_HOST,
        s3Configured: !!process.env.AWS_ACCESS_KEY_ID,
        idealistaDataConfigured: !!(
          process.env.IDEALISTA_DATA_EMAIL && process.env.IDEALISTA_DATA_PASSWORD
        ),
        turnstileConfigured: !!process.env.TURNSTILE_SECRET_KEY,
        sentryConfigured: !!process.env.SENTRY_DSN,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    logger.error('[Monitoring Error]:', error);
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 });
  }
}

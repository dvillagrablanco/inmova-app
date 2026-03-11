import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/benchmarks
 *
 * Returns benchmark indices data for performance comparison.
 *
 * Query params:
 *   from - start date
 *   to - end date
 *   name - filter by benchmark name
 *   latest - if "true", latest data point per benchmark
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = session.user.companyId;
    const name = searchParams.get('name');
    const latest = searchParams.get('latest') === 'true';

    const prisma = await getPrisma();

    const where: any = { companyId };
    if (name) where.name = { contains: name, mode: 'insensitive' };

    if (latest) {
      const benchmarks = await prisma.portfolioBenchmark.findMany({
        where,
        distinct: ['name'],
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ success: true, data: benchmarks });
    }

    const benchmarks = await prisma.portfolioBenchmark.findMany({
      where,
      orderBy: [{ name: 'asc' }, { date: 'asc' }],
    });

    // Group by name
    const grouped: Record<string, any[]> = {};
    for (const b of benchmarks) {
      if (!grouped[b.name]) grouped[b.name] = [];
      grouped[b.name].push(b);
    }

    return NextResponse.json({
      success: true,
      data: {
        benchmarks,
        grouped,
        names: Object.keys(grouped),
      },
    });
  } catch (error: any) {
    logger.error('[Benchmarks API]:', error);
    return NextResponse.json({ error: 'Error obteniendo benchmarks' }, { status: 500 });
  }
}

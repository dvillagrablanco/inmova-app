/**
 * Web Vitals Analytics Endpoint
 *
 * Recibe métricas de Web Vitals del cliente y las guarda en la base de datos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WebVitalsPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: WebVitalsPayload = await request.json();

    // Validar datos
    if (!data.name || typeof data.value !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Obtener metadata de la request
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Guardar en base de datos
    await prisma.webVitals.create({
      data: {
        metric: data.name,
        value: data.value,
        rating: data.rating,
        delta: data.delta,
        metricId: data.id,
        navigationType: data.navigationType,
        url: referer,
        userAgent,
        ipAddress: ip,
      },
    });

    // Log para análisis
    logger.info('Web Vitals recorded', {
      metric: data.name,
      value: data.value,
      rating: data.rating,
      url: referer,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error recording web vitals', { error: error.message });

    // No fallar la request del cliente
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// GET para obtener estadísticas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query con agregaciones
    const stats = await prisma.webVitals.groupBy({
      by: ['metric', 'rating'],
      where: {
        ...(metric && { metric }),
        createdAt: { gte: startDate },
      },
      _count: true,
      _avg: {
        value: true,
      },
      _max: {
        value: true,
      },
      _min: {
        value: true,
      },
    });

    // Calcular percentiles (p75, p90, p95)
    const percentiles: Record<string, any> = {};

    for (const metricName of ['LCP', 'FID', 'CLS', 'FCP', 'TTFB']) {
      const values = await prisma.webVitals.findMany({
        where: {
          metric: metricName,
          createdAt: { gte: startDate },
        },
        select: { value: true },
        orderBy: { value: 'asc' },
      });

      if (values.length > 0) {
        const sorted = values.map((v) => v.value).sort((a, b) => a - b);
        const p75Index = Math.floor(sorted.length * 0.75);
        const p90Index = Math.floor(sorted.length * 0.9);
        const p95Index = Math.floor(sorted.length * 0.95);

        percentiles[metricName] = {
          p75: sorted[p75Index],
          p90: sorted[p90Index],
          p95: sorted[p95Index],
        };
      }
    }

    return NextResponse.json({
      stats,
      percentiles,
      period: `${days} days`,
    });
  } catch (error: any) {
    logger.error('Error fetching web vitals stats', { error: error.message });
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

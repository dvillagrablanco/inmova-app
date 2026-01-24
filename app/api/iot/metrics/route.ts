import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const temperatureMetrics = ['temperatura', 'temperature', 'temp'];
const energyMetrics = ['energia', 'energy', 'consumo', 'consumption', 'kwh'];

const formatHourLabel = (date: Date) => {
  const day = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  const hour = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${hour}`;
};

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const tempStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const energyStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [temperatureReadings, energyReadings] = await Promise.all([
      prisma.ioTReading.findMany({
        where: {
          metrica: { in: temperatureMetrics },
          timestamp: { gte: tempStart },
          device: { companyId },
        },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.ioTReading.findMany({
        where: {
          metrica: { in: energyMetrics },
          timestamp: { gte: energyStart },
          device: { companyId },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    const tempBuckets = new Map<string, { label: string; sum: number; count: number }>();
    let tempSum = 0;
    let tempCount = 0;

    temperatureReadings.forEach((reading) => {
      const bucketKey = reading.timestamp.toISOString().slice(0, 13);
      const bucket = tempBuckets.get(bucketKey) || {
        label: formatHourLabel(reading.timestamp),
        sum: 0,
        count: 0,
      };
      bucket.sum += reading.valor;
      bucket.count += 1;
      tempBuckets.set(bucketKey, bucket);
      tempSum += reading.valor;
      tempCount += 1;
    });

    const tempTarget = tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : 0;
    const temperatureSeries = Array.from(tempBuckets.values()).map((bucket) => ({
      time: bucket.label,
      temp: Math.round((bucket.sum / bucket.count) * 10) / 10,
      target: tempTarget,
    }));

    const energyMap = new Map<string, number>();
    energyReadings.forEach((reading) => {
      const key = reading.timestamp.toISOString().slice(0, 10);
      energyMap.set(key, (energyMap.get(key) || 0) + reading.valor);
    });

    const energySeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        day: dayLabels[date.getDay()],
        consumption: Math.round((energyMap.get(key) || 0) * 10) / 10,
      };
    });

    const currentSum = energySeries.reduce((sum, item) => sum + item.consumption, 0);
    let previousSum = 0;
    for (let i = 7; i < 14; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      previousSum += energyMap.get(key) || 0;
    }

    const energySavings =
      previousSum > 0 ? Math.max(0, Math.round(((previousSum - currentSum) / previousSum) * 100)) : 0;

    return NextResponse.json({
      temperatureSeries,
      energySeries,
      energySavings,
    });
  } catch (error) {
    logger.error('[IoT] Error loading metrics:', error);
    return NextResponse.json({ error: 'Error al cargar metricas' }, { status: 500 });
  }
}

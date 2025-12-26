/**
 * Endpoint para obtener estadísticas de las colas de trabajos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isBullMQAvailable } from '@/lib/queues/queue-config';
import { getEmailQueueStats } from '@/lib/queues/email-queue';
import { getReportQueueStats } from '@/lib/queues/report-queue';
import { getSyncQueueStats } from '@/lib/queues/sync-queue';
import { isRedisAvailable, getRedisStats } from '@/lib/redis-config';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/queues/stats
 * Obtiene estadísticas de todas las colas y Redis
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar disponibilidad de BullMQ
    const bullmqAvailable = isBullMQAvailable();
    const redisAvailable = await isRedisAvailable();

    // Obtener estadísticas de las colas
    const [emailStats, reportStats, syncStats, redisStats] = await Promise.all([
      getEmailQueueStats(),
      getReportQueueStats(),
      getSyncQueueStats(),
      getRedisStats(),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      infrastructure: {
        redis: {
          available: redisAvailable,
          ...redisStats,
        },
        bullmq: {
          available: bullmqAvailable,
        },
      },
      queues: {
        email: emailStats,
        report: reportStats,
        sync: syncStats,
      },
    };

    logger.info('Queue stats retrieved successfully');
    return NextResponse.json(response);
  } catch (error: any) {
    logger.error('Error getting queue stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de colas' }, { status: 500 });
  }
}

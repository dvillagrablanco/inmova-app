/**
 * Cola de trabajos para sincronizaciones y tareas programadas
 */

import { Queue } from 'bullmq';
import { createQueue, QueueName, isBullMQAvailable } from './queue-config';
import { SyncJobData, SyncType } from './queue-types';
import logger from '../logger';

// Cola de sincronización
let syncQueue: Queue | null = null;

/**
 * Inicializa la cola de sincronización
 */
function getSyncQueue(): Queue | null {
  if (!syncQueue && isBullMQAvailable()) {
    syncQueue = createQueue(QueueName.SYNC);
  }
  return syncQueue;
}

/**
 * Añade un trabajo de sincronización a la cola
 */
export async function addSyncJob(
  data: SyncJobData,
  options?: {
    priority?: number;
    delay?: number;
    repeat?: {
      pattern?: string; // Cron pattern
      every?: number; // Milisegundos
    };
  }
): Promise<string | null> {
  const queue = getSyncQueue();

  if (!queue) {
    logger.warn('⚠️  Sync queue not available - cannot add sync job');
    return null;
  }

  try {
    const job = await queue.add(
      data.type,
      data,
      {
        priority: options?.priority,
        delay: options?.delay,
        repeat: options?.repeat,
      }
    );

    logger.info(`✅ Sync job ${job.id} added to queue: ${data.type}`);
    return job.id || null;
  } catch (error) {
    logger.error('❌ Failed to add sync job to queue:', error);
    throw error;
  }
}

/**
 * Sincroniza el estado de los pagos
 * Actualiza pagos vencidos, próximos a vencer, etc.
 */
export async function syncPaymentStatus(companyId: string): Promise<string | null> {
  return addSyncJob({
    type: SyncType.PAYMENT_STATUS,
    companyId,
  });
}

/**
 * Sincroniza el estado de los contratos
 * Actualiza contratos vencidos, próximos a vencer, etc.
 */
export async function syncContractStatus(companyId: string): Promise<string | null> {
  return addSyncJob({
    type: SyncType.CONTRACT_STATUS,
    companyId,
  });
}

/**
 * Sincroniza la disponibilidad de unidades
 * Actualiza el estado de las unidades basado en contratos activos
 */
export async function syncUnitAvailability(companyId: string): Promise<string | null> {
  return addSyncJob({
    type: SyncType.UNIT_AVAILABILITY,
    companyId,
  });
}

/**
 * Programa sincronización periódica de estados de pago
 * Se ejecuta diariamente a las 00:00
 */
export async function schedulePaymentStatusSync(companyId: string): Promise<string | null> {
  return addSyncJob(
    {
      type: SyncType.PAYMENT_STATUS,
      companyId,
    },
    {
      repeat: {
        pattern: '0 0 * * *', // Diario a medianoche
      },
    }
  );
}

/**
 * Programa sincronización periódica de estados de contrato
 * Se ejecuta diariamente a las 01:00
 */
export async function scheduleContractStatusSync(companyId: string): Promise<string | null> {
  return addSyncJob(
    {
      type: SyncType.CONTRACT_STATUS,
      companyId,
    },
    {
      repeat: {
        pattern: '0 1 * * *', // Diario a la 1 AM
      },
    }
  );
}

/**
 * Programa backup periódico
 * Se ejecuta semanalmente los domingos a las 02:00
 */
export async function scheduleBackup(companyId: string): Promise<string | null> {
  return addSyncJob(
    {
      type: SyncType.BACKUP,
      companyId,
    },
    {
      repeat: {
        pattern: '0 2 * * 0', // Domingos a las 2 AM
      },
    }
  );
}

/**
 * Obtiene estadísticas de la cola de sincronización
 */
export async function getSyncQueueStats(): Promise<any> {
  const queue = getSyncQueue();
  
  if (!queue) {
    return { available: false };
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    // Obtener trabajos repetidos (programados)
    const repeatableJobs = await queue.getRepeatableJobs();

    return {
      available: true,
      waiting,
      active,
      completed,
      failed,
      delayed,
      repeatable: repeatableJobs.length,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Failed to get sync queue stats:', error);
    return { available: true, error: 'Failed to get stats' };
  }
}

export { syncQueue };

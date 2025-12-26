/**
 * Configuración de BullMQ para trabajos asíncronos
 * Usa Redis como backend de colas si está disponible
 */

import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { redis } from '../redis-config';
import logger from '../logger';

/**
 * Opciones base para las colas
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redis || undefined,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Mantener solo los últimos 100 trabajos completados
    },
    removeOnFail: {
      count: 50, // Mantener solo los últimos 50 trabajos fallidos
    },
  },
};

/**
 * Opciones base para los workers
 */
export const defaultWorkerOptions: Partial<WorkerOptions> = {
  connection: redis || undefined,
  concurrency: 5, // Número de trabajos que se procesan simultáneamente
  limiter: {
    max: 10, // Máximo 10 trabajos por duración
    duration: 1000, // 1 segundo
  },
};

/**
 * Nombres de las colas disponibles
 */
export enum QueueName {
  EMAIL = 'email',
  REPORT = 'report',
  SYNC = 'sync',
  NOTIFICATION = 'notification',
}

/**
 * Verifica si BullMQ está disponible (requiere Redis)
 */
export function isBullMQAvailable(): boolean {
  const available = redis !== null;

  if (!available) {
    logger.warn('⚠️  BullMQ not available - Redis is required for job queues');
  }

  return available;
}

/**
 * Helper para crear una cola con configuración estándar
 */
export function createQueue(name: QueueName, options?: Partial<QueueOptions>): Queue | null {
  if (!isBullMQAvailable()) {
    logger.warn(`Cannot create queue "${name}" - BullMQ not available`);
    return null;
  }

  try {
    const queue = new Queue(name, {
      ...defaultQueueOptions,
      ...options,
    });

    logger.info(`✅ Queue "${name}" created successfully`);
    return queue;
  } catch (error) {
    logger.error(`❌ Failed to create queue "${name}":`, error);
    return null;
  }
}

/**
 * Helper para crear un worker con configuración estándar
 */
export function createWorker(
  name: QueueName,
  processor: (job: any) => Promise<any>,
  options?: Partial<WorkerOptions>
): Worker | null {
  if (!isBullMQAvailable()) {
    logger.warn(`Cannot create worker for queue "${name}" - BullMQ not available`);
    return null;
  }

  if (!redis) {
    logger.warn(`Cannot create worker for queue "${name}" - Redis not available`);
    return null;
  }

  try {
    const worker = new Worker(name, processor, {
      connection: redis,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
      ...options,
    });

    // Event listeners
    worker.on('completed', (job) => {
      logger.info(`✅ Job ${job.id} in queue "${name}" completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`❌ Job ${job?.id} in queue "${name}" failed:`, err);
    });

    worker.on('error', (err) => {
      logger.error(`❌ Worker error in queue "${name}":`, err);
    });

    logger.info(`✅ Worker for queue "${name}" created successfully`);
    return worker;
  } catch (error) {
    logger.error(`❌ Failed to create worker for queue "${name}":`, error);
    return null;
  }
}

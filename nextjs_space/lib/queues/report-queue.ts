/**
 * Cola de trabajos para generación de reportes
 */

import { Queue } from 'bullmq';
import { createQueue, QueueName, isBullMQAvailable } from './queue-config';
import { ReportJobData, ReportType } from './queue-types';
import logger from '../logger';

// Cola de reportes
let reportQueue: Queue | null = null;

/**
 * Inicializa la cola de reportes
 */
function getReportQueue(): Queue | null {
  if (!reportQueue && isBullMQAvailable()) {
    reportQueue = createQueue(QueueName.REPORT, {
      defaultJobOptions: {
        attempts: 2, // Menos intentos para reportes (son costosos)
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
  }
  return reportQueue;
}

/**
 * Añade un trabajo de generación de reporte a la cola
 */
export async function addReportJob(
  data: ReportJobData,
  options?: {
    priority?: number;
    delay?: number;
  }
): Promise<string | null> {
  const queue = getReportQueue();

  if (!queue) {
    logger.warn('⚠️  Report queue not available - cannot generate report asynchronously');
    return null;
  }

  try {
    const job = await queue.add(
      data.type,
      data,
      {
        priority: options?.priority || 5, // Prioridad baja por defecto
        delay: options?.delay,
      }
    );

    logger.info(`✅ Report job ${job.id} added to queue: ${data.type}`);
    return job.id || null;
  } catch (error) {
    logger.error('❌ Failed to add report job to queue:', error);
    throw error;
  }
}

/**
 * Genera un reporte financiero
 */
export async function generateFinancialReport(
  companyId: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  format: 'pdf' | 'excel' = 'pdf',
  notifyEmail?: string
): Promise<string | null> {
  return addReportJob({
    type: ReportType.FINANCIAL,
    companyId,
    userId,
    parameters: {
      startDate,
      endDate,
      format,
    },
    notifyEmail,
  });
}

/**
 * Genera un reporte de ocupación
 */
export async function generateOccupancyReport(
  companyId: string,
  userId: string,
  buildingId?: string,
  format: 'pdf' | 'excel' = 'pdf',
  notifyEmail?: string
): Promise<string | null> {
  return addReportJob({
    type: ReportType.OCCUPANCY,
    companyId,
    userId,
    parameters: {
      buildingId,
      format,
    },
    notifyEmail,
  });
}

/**
 * Genera un reporte de pagos
 */
export async function generatePaymentsReport(
  companyId: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  format: 'pdf' | 'excel' | 'csv' = 'excel',
  notifyEmail?: string
): Promise<string | null> {
  return addReportJob({
    type: ReportType.PAYMENTS,
    companyId,
    userId,
    parameters: {
      startDate,
      endDate,
      format,
    },
    notifyEmail,
  });
}

/**
 * Genera un reporte de mantenimiento
 */
export async function generateMaintenanceReport(
  companyId: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  buildingId?: string,
  format: 'pdf' | 'excel' = 'pdf',
  notifyEmail?: string
): Promise<string | null> {
  return addReportJob({
    type: ReportType.MAINTENANCE,
    companyId,
    userId,
    parameters: {
      startDate,
      endDate,
      buildingId,
      format,
    },
    notifyEmail,
  });
}

/**
 * Obtiene el estado de un trabajo de reporte
 */
export async function getReportJobStatus(jobId: string): Promise<any> {
  const queue = getReportQueue();
  
  if (!queue) {
    return { available: false };
  }

  try {
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { found: false };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      found: true,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  } catch (error) {
    logger.error(`Failed to get report job status for ${jobId}:`, error);
    return { error: 'Failed to get job status' };
  }
}

/**
 * Obtiene estadísticas de la cola de reportes
 */
export async function getReportQueueStats(): Promise<any> {
  const queue = getReportQueue();
  
  if (!queue) {
    return { available: false };
  }

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return {
      available: true,
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  } catch (error) {
    logger.error('Failed to get report queue stats:', error);
    return { available: true, error: 'Failed to get stats' };
  }
}

export { reportQueue };

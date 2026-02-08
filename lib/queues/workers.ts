/**
 * Workers para procesar trabajos asíncronos
 * Este archivo debe ejecutarse en un proceso separado en producción
 */

import { Job } from 'bullmq';
import { createWorker, QueueName } from './queue-config';
import {
  EmailJobData,
  ReportJobData,
  SyncJobData,
  NotificationJobData,
} from './queue-types';
import logger from '../logger';
import { sendEmail as sendTransactionalEmail } from '@/lib/email-service';

/**
 * Procesador de trabajos de email
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  logger.info(`Processing email job ${job.id}`);
  const { to, subject, html, from, cc, bcc, attachments } = job.data;

  try {
    const ok = await sendTransactionalEmail({
      to,
      subject,
      html,
      from,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        path: attachment.path,
      })),
    });

    if (!ok) {
      throw new Error('Error enviando email');
    }

    logger.info(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    throw error; // Re-throw para que BullMQ reintente
  }
}

/**
 * Procesador de trabajos de reportes
 */
async function processReportJob(job: Job<ReportJobData>): Promise<string> {
  logger.info(`Processing report job ${job.id}`);
  const { type, companyId, userId, parameters, notifyEmail } = job.data;

  try {
    // Actualizar progreso
    await job.updateProgress(10);
    logger.info(`📄 Generating ${type} report for company ${companyId}`);
    
    // Aquí iría la lógica real de generación de reportes
    // Por ejemplo, usando PDFKit, ExcelJS, etc.
    
    await job.updateProgress(30);
    // Simulación: obtener datos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await job.updateProgress(60);
    // Simulación: generar documento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await job.updateProgress(90);
    // Simulación: guardar archivo
    const reportUrl = `/reports/${type}-${companyId}-${Date.now()}.pdf`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await job.updateProgress(100);
    
    // Si se especificó email de notificación, enviarlo
    if (notifyEmail) {
      logger.info(`Sending report notification to: ${notifyEmail}`);
      // TODO: Añadir trabajo de email para notificar
    }
    
    logger.info(`✅ Report generated successfully: ${reportUrl}`);
    return reportUrl;
  } catch (error) {
    logger.error(`❌ Failed to generate report:`, error);
    throw error;
  }
}

/**
 * Procesador de trabajos de sincronización
 */
async function processSyncJob(job: Job<SyncJobData>): Promise<void> {
  logger.info(`Processing sync job ${job.id}`);
  const { type, companyId, entityId, force } = job.data;

  try {
    logger.info(`🔄 Syncing ${type} for company ${companyId}`);
    
    // Aquí iría la lógica real de sincronización
    // Por ejemplo:
    // - Actualizar estados de pagos
    // - Verificar contratos vencidos
    // - Sincronizar con APIs externas
    // - Realizar backups
    
    // Simulación:
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    logger.info(`✅ Sync completed successfully for ${type}`);
  } catch (error) {
    logger.error(`❌ Failed to sync ${type}:`, error);
    throw error;
  }
}

/**
 * Procesador de trabajos de notificaciones
 */
async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  logger.info(`Processing notification job ${job.id}`);
  const { type, userId, title, message, data, channels } = job.data;

  try {
    logger.info(`🔔 Sending ${type} notification to user ${userId}`);
    
    // Aquí iría la lógica real de notificaciones
    // Por ejemplo:
    // - Enviar push notification
    // - Enviar SMS
    // - Guardar notificación in-app en la BD
    // - Enviar email (usando la cola de emails)
    
    // Simulación:
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info(`✅ Notification sent successfully to user ${userId}`);
  } catch (error) {
    logger.error(`❌ Failed to send notification to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Inicializa todos los workers
 * NOTA: En producción, esto debería ejecutarse en un proceso separado
 */
export function initializeWorkers(): void {
  logger.info('👷 Initializing BullMQ workers...');

  // Worker de emails
  const emailWorker = createWorker(QueueName.EMAIL, processEmailJob, {
    concurrency: 3, // Procesar hasta 3 emails simultáneamente
  });

  // Worker de reportes
  const reportWorker = createWorker(QueueName.REPORT, processReportJob, {
    concurrency: 2, // Procesar hasta 2 reportes simultáneamente (son más pesados)
  });

  // Worker de sincronización
  const syncWorker = createWorker(QueueName.SYNC, processSyncJob, {
    concurrency: 1, // Procesar de uno en uno para evitar conflictos
  });

  // Worker de notificaciones
  const notificationWorker = createWorker(QueueName.NOTIFICATION, processNotificationJob, {
    concurrency: 5, // Procesar hasta 5 notificaciones simultáneamente
  });

  // Manejar señales para graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`🛑 Received ${signal}, shutting down workers gracefully...`);
    
    const workers = [emailWorker, reportWorker, syncWorker, notificationWorker].filter(Boolean);
    
    await Promise.all(
      workers.map(worker => worker?.close())
    );
    
    logger.info('✅ All workers shut down successfully');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  logger.info('✅ All workers initialized successfully');
}

/**
 * Si este archivo se ejecuta directamente, iniciar los workers
 */
if (require.main === module) {
  initializeWorkers();
}

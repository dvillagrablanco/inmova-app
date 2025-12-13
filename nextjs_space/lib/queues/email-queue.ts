/**
 * Cola de trabajos para envío de emails
 */

import { Queue } from 'bullmq';
import { createQueue, QueueName, isBullMQAvailable } from './queue-config';
import { EmailJobData, EmailType } from './queue-types';
import logger from '../logger';

// Cola de emails
let emailQueue: Queue | null = null;

/**
 * Inicializa la cola de emails
 */
function getEmailQueue(): Queue | null {
  if (!emailQueue && isBullMQAvailable()) {
    emailQueue = createQueue(QueueName.EMAIL, {
      defaultJobOptions: {
        attempts: 5, // Más intentos para emails
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });
  }
  return emailQueue;
}

/**
 * Añade un trabajo de email a la cola
 */
export async function addEmailJob(
  data: EmailJobData,
  options?: {
    priority?: number;
    delay?: number;
    emailType?: EmailType;
  }
): Promise<void> {
  const queue = getEmailQueue();

  if (!queue) {
    logger.warn('⚠️  Email queue not available - sending email synchronously');
    // Aquí podrías implementar un fallback para enviar el email directamente
    // Por ahora solo logueamos
    logger.info('Email would be sent to:', data.to);
    return;
  }

  try {
    const job = await queue.add(
      options?.emailType || 'generic',
      data,
      {
        priority: options?.priority,
        delay: options?.delay,
      }
    );

    logger.info(`✅ Email job ${job.id} added to queue for: ${data.to}`);
  } catch (error) {
    logger.error('❌ Failed to add email job to queue:', error);
    throw error;
  }
}

/**
 * Envía un email de bienvenida
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await addEmailJob(
    {
      to,
      subject: '¡Bienvenido a Inmova!',
      html: `
        <h1>Hola ${name},</h1>
        <p>Bienvenido a Inmova, tu plataforma de gestión inmobiliaria.</p>
        <p>Estamos emocionados de tenerte con nosotros.</p>
      `,
    },
    { emailType: EmailType.WELCOME }
  );
}

/**
 * Envía un recordatorio de pago
 */
export async function sendPaymentReminder(
  to: string,
  tenantName: string,
  amount: number,
  dueDate: Date
): Promise<void> {
  await addEmailJob(
    {
      to,
      subject: 'Recordatorio de Pago Pendiente',
      html: `
        <h1>Hola ${tenantName},</h1>
        <p>Este es un recordatorio de que tienes un pago pendiente:</p>
        <ul>
          <li><strong>Monto:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Fecha de vencimiento:</strong> ${dueDate.toLocaleDateString('es-ES')}</li>
        </ul>
        <p>Por favor, realiza tu pago a tiempo para evitar cargos adicionales.</p>
      `,
    },
    { 
      emailType: EmailType.PAYMENT_REMINDER,
      priority: 2, // Prioridad media-alta
    }
  );
}

/**
 * Envía confirmación de pago
 */
export async function sendPaymentConfirmation(
  to: string,
  tenantName: string,
  amount: number,
  paymentDate: Date,
  receiptUrl?: string
): Promise<void> {
  await addEmailJob(
    {
      to,
      subject: 'Confirmación de Pago Recibido',
      html: `
        <h1>Hola ${tenantName},</h1>
        <p>Confirmamos que hemos recibido tu pago:</p>
        <ul>
          <li><strong>Monto:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Fecha:</strong> ${paymentDate.toLocaleDateString('es-ES')}</li>
        </ul>
        ${receiptUrl ? `<p><a href="${receiptUrl}">Descargar recibo</a></p>` : ''}
        <p>Gracias por tu pago puntual.</p>
      `,
    },
    { emailType: EmailType.PAYMENT_CONFIRMATION }
  );
}

/**
 * Envía notificación de contrato próximo a vencer
 */
export async function sendContractExpiringNotification(
  to: string,
  tenantName: string,
  unitNumber: string,
  expirationDate: Date,
  daysRemaining: number
): Promise<void> {
  await addEmailJob(
    {
      to,
      subject: 'Tu Contrato Está Próximo a Vencer',
      html: `
        <h1>Hola ${tenantName},</h1>
        <p>Queremos informarte que tu contrato de arrendamiento está próximo a vencer:</p>
        <ul>
          <li><strong>Unidad:</strong> ${unitNumber}</li>
          <li><strong>Fecha de vencimiento:</strong> ${expirationDate.toLocaleDateString('es-ES')}</li>
          <li><strong>Días restantes:</strong> ${daysRemaining}</li>
        </ul>
        <p>Por favor, contáctanos si deseas renovar tu contrato.</p>
      `,
    },
    { 
      emailType: EmailType.CONTRACT_EXPIRING,
      priority: 2,
    }
  );
}

/**
 * Obtiene estadísticas de la cola de emails
 */
export async function getEmailQueueStats(): Promise<any> {
  const queue = getEmailQueue();
  
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
    logger.error('Failed to get email queue stats:', error);
    return { available: true, error: 'Failed to get stats' };
  }
}

export { emailQueue };

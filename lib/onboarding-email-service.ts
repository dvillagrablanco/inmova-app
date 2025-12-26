/**
 * Servicio de Emails para Zero-Touch Onboarding
 * Gestiona el envío programado de emails transaccionales durante el onboarding
 */

import { prisma } from './db';
import { sendEmail as sendSendGridEmail, isSendGridConfigured } from './sendgrid-service';
import { sendEmail as sendNodemailerEmail } from './email-service';
import logger from './logger';
import {
  getWelcomeEmailTemplate,
  getOnboardingReminderTemplate,
  getTaskCompletedTemplate,
  getOnboardingCompletedTemplate,
  getBuildingCreatedTemplate,
  getFirstContractTemplate,
} from './email-templates/onboarding-templates';

export type EmailType =
  | 'welcome'
  | 'onboarding_reminder'
  | 'task_completed'
  | 'onboarding_completed'
  | 'building_created'
  | 'first_contract'
  | 'milestone_achieved';

interface SendOnboardingEmailOptions {
  userId: string;
  companyId: string;
  type: EmailType;
  templateData: Record<string, any>;
  scheduledFor?: Date; // Si se proporciona, se programa para el futuro
}

interface EmailTemplateData {
  userName: string;
  userEmail: string;
  companyName?: string;
  vertical?: string;
  progress?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  nextTask?: string;
  actionUrl?: string;
  [key: string]: any;
}

/**
 * Envía un email de onboarding o lo programa para el futuro
 */
export async function sendOnboardingEmail(
  options: SendOnboardingEmailOptions
): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
  try {
    const { userId, companyId, type, templateData, scheduledFor } = options;

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    // Preparar datos del template
    const emailData: EmailTemplateData = {
      userName: user.name,
      userEmail: user.email,
      companyName: user.company.nombre,
      vertical: user.businessVertical || undefined,
      ...templateData,
    };

    // Generar HTML del template
    const { subject, html } = getEmailTemplate(type, emailData);

    // Si es para el futuro, crear registro en EmailLog con estado 'scheduled'
    if (scheduledFor && scheduledFor > new Date()) {
      const emailLog = await prisma.emailLog.create({
        data: {
          userId,
          companyId,
          type,
          recipient: user.email,
          subject,
          body: html,
          status: 'scheduled',
          scheduledFor,
          metadata: templateData,
        },
      });

      logger.info(`Email programado para ${scheduledFor.toISOString()}: ${type}`, {
        emailLogId: emailLog.id,
        userId,
      });

      return { success: true, emailLogId: emailLog.id };
    }

    // Enviar inmediatamente
    const result = await sendEmailNow({
      to: user.email,
      subject,
      html,
      userId,
      companyId,
      type,
      metadata: templateData,
    });

    return result;
  } catch (error: any) {
    logger.error('Error en sendOnboardingEmail:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía un email inmediatamente y registra en EmailLog
 */
export async function sendEmailNow(options: {
  to: string;
  subject: string;
  html: string;
  userId: string;
  companyId: string;
  type: EmailType;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; emailLogId?: string; error?: string }> {
  try {
    const { to, subject, html, userId, companyId, type, metadata } = options;

    // Crear registro en EmailLog con estado 'pending'
    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        companyId,
        type,
        recipient: to,
        subject,
        body: html,
        status: 'pending',
        metadata: metadata || {},
      },
    });

    try {
      // Intentar enviar con SendGrid primero
      if (isSendGridConfigured()) {
        const result = await sendSendGridEmail({
          to,
          subject,
          html,
          from: process.env.SENDGRID_FROM_EMAIL,
          fromName: 'INMOVA',
        });

        if (result.success) {
          // Actualizar a 'sent'
          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              provider: 'sendgrid',
              externalId: result.messageId,
            },
          });

          logger.info(`Email enviado con SendGrid: ${type}`, {
            emailLogId: emailLog.id,
            recipient: to,
          });

          return { success: true, emailLogId: emailLog.id };
        } else {
          throw new Error(result.error || 'Error desconocido de SendGrid');
        }
      }

      // Fallback a Nodemailer
      const success = await sendNodemailerEmail({
        to,
        subject,
        html,
      });

      if (success) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            provider: 'nodemailer',
          },
        });

        logger.info(`Email enviado con Nodemailer: ${type}`, {
          emailLogId: emailLog.id,
          recipient: to,
        });

        return { success: true, emailLogId: emailLog.id };
      } else {
        throw new Error('Nodemailer falló al enviar email');
      }
    } catch (sendError: any) {
      // Marcar como 'failed'
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          error: sendError.message,
        },
      });

      logger.error('Error al enviar email:', sendError);
      return { success: false, error: sendError.message };
    }
  } catch (error: any) {
    logger.error('Error en sendEmailNow:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el template HTML para un tipo de email
 */
function getEmailTemplate(
  type: EmailType,
  data: EmailTemplateData
): { subject: string; html: string } {
  switch (type) {
    case 'welcome':
      return getWelcomeEmailTemplate(data);
    case 'onboarding_reminder':
      return getOnboardingReminderTemplate(data);
    case 'task_completed':
      return getTaskCompletedTemplate(data);
    case 'onboarding_completed':
      return getOnboardingCompletedTemplate(data);
    case 'building_created':
      return getBuildingCreatedTemplate(data);
    case 'first_contract':
      return getFirstContractTemplate(data);
    default:
      return {
        subject: 'Notificación de INMOVA',
        html: `<p>Tienes una nueva notificación.</p>`,
      };
  }
}

/**
 * Procesa emails programados que ya deben enviarse
 * Esta función debe ser llamada por un cron job
 */
export async function processScheduledEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  try {
    const now = new Date();

    // Obtener emails programados cuya fecha ya pasó
    const scheduledEmails = await prisma.emailLog.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      take: 50, // Procesar máximo 50 por ejecución
      include: {
        user: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const email of scheduledEmails) {
      try {
        const result = await sendEmailNow({
          to: email.recipient,
          subject: email.subject,
          html: email.body,
          userId: email.userId,
          companyId: email.companyId,
          type: email.type as EmailType,
          metadata: email.metadata as Record<string, any>,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error(`Error procesando email programado ${email.id}:`, error);
        failed++;

        // Marcar como failed
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Error desconocido',
          },
        });
      }
    }

    logger.info(`Emails programados procesados: ${scheduledEmails.length}`, {
      sent,
      failed,
    });

    return {
      processed: scheduledEmails.length,
      sent,
      failed,
    };
  } catch (error: any) {
    logger.error('Error en processScheduledEmails:', error);
    throw error;
  }
}

/**
 * Programa emails automáticos después del signup
 */
export async function scheduleOnboardingEmailSequence(
  userId: string,
  companyId: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, businessVertical: true },
    });

    if (!user) return;

    const now = new Date();

    // Email 1: Bienvenida (inmediato)
    await sendOnboardingEmail({
      userId,
      companyId,
      type: 'welcome',
      templateData: {
        userName: user.name,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
    });

    // Email 2: Recordatorio si no completa onboarding (2 horas)
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    await sendOnboardingEmail({
      userId,
      companyId,
      type: 'onboarding_reminder',
      templateData: {
        userName: user.name,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
      scheduledFor: in2Hours,
    });

    // Email 3: Segundo recordatorio (24 horas)
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await sendOnboardingEmail({
      userId,
      companyId,
      type: 'onboarding_reminder',
      templateData: {
        userName: user.name,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
        isSecondReminder: true,
      },
      scheduledFor: in24Hours,
    });

    logger.info(`Secuencia de emails programada para usuario ${userId}`);
  } catch (error) {
    logger.error('Error programando secuencia de emails:', error);
  }
}

/**
 * 📧 SERVICIO DE TRIGGERS DE EMAILS AUTOMÁTICOS
 * 
 * Sistema de envío automático de emails en momentos específicos del journey del usuario:
 * - 2 horas después del signup (si no ha completado onboarding)
 * - 24 horas después del signup (recordatorio)
 * - 7 días después (seguimiento)
 * - 30 días después (feedback y tips avanzados)
 * 
 * Los emails se programan al momento del signup y se procesan periódicamente
 * mediante un cron job.
 */

import { prisma } from '@/lib/db';
import { sendOnboardingEmail } from '@/lib/onboarding-email-service';
import { addHours, addDays } from 'date-fns';

import logger from '@/lib/logger';
export type EmailTriggerType =
  | 'SIGNUP_2H'
  | 'SIGNUP_24H'
  | 'SIGNUP_7D'
  | 'SIGNUP_30D'
  | 'TASK_INCOMPLETE_2H'
  | 'TASK_INCOMPLETE_24H';

/**
 * Programa los emails automáticos para un nuevo usuario
 */
export async function scheduleOnboardingEmails(userId: string, userEmail: string) {
  try {
    const now = new Date();

    const triggers: { type: EmailTriggerType; scheduledFor: Date }[] = [
      { type: 'SIGNUP_2H', scheduledFor: addHours(now, 2) },
      { type: 'SIGNUP_24H', scheduledFor: addDays(now, 1) },
      { type: 'SIGNUP_7D', scheduledFor: addDays(now, 7) },
      { type: 'SIGNUP_30D', scheduledFor: addDays(now, 30) },
    ];

    for (const trigger of triggers) {
      await prisma.emailLog.create({
        data: {
          userId,
          recipientEmail: userEmail,
          templateType: trigger.type,
          status: 'SCHEDULED',
          scheduledFor: trigger.scheduledFor,
          metadata: { trigger: trigger.type },
        },
      });
    }

    console.log(
      `[EmailTriggers] Scheduled ${triggers.length} onboarding emails for user ${userId}`
    );
    return true;
  } catch (error) {
    logger.error('[EmailTriggers] Error scheduling emails:', error);
    return false;
  }
}

/**
 * Procesa los emails programados que ya deben enviarse
 * Esta función debe ejecutarse periódicamente (ej: cada 10 minutos)
 */
export async function processScheduledEmails() {
  try {
    const now = new Date();

    // Obtener emails programados que ya deben enviarse
    const emailsToSend = await prisma.emailLog.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      include: {
        user: true,
      },
      take: 50, // Procesar máximo 50 emails por ejecución
    });

    console.log(`[EmailTriggers] Processing ${emailsToSend.length} scheduled emails`);

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const emailLog of emailsToSend) {
      try {
        // Verificar si el usuario completó el onboarding (si es un email de onboarding)
        if (emailLog.templateType.startsWith('SIGNUP_')) {
          const user = await prisma.user.findUnique({
            where: { id: emailLog.userId },
            select: { onboardingCompleted: true },
          });

          // Si ya completó el onboarding, cancelar el email
          if (user?.onboardingCompleted) {
            await prisma.emailLog.update({
              where: { id: emailLog.id },
              data: { status: 'CANCELLED' },
            });
            skippedCount++;
            console.log(
              `[EmailTriggers] Skipped email ${emailLog.id} - onboarding already completed`
            );
            continue;
          }
        }

        // Determinar el tipo de email a enviar
        const emailType = mapTriggerToEmailType(emailLog.templateType);
        
        // Enviar el email
        const result = await sendOnboardingEmail(
          emailLog.recipientEmail,
          emailType,
          {
            userName: emailLog.user.name || 'Usuario',
            vertical: emailLog.user.vertical || 'GENERAL',
          }
        );

        // Actualizar el log
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: result.success ? new Date() : null,
            error: result.error,
            metadata: {
              ...emailLog.metadata,
              processedAt: new Date().toISOString(),
            },
          },
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        logger.error(`[EmailTriggers] Error processing email ${emailLog.id}:`, error);
        
        // Marcar como fallido
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        failedCount++;
      }
    }

    console.log(
      `[EmailTriggers] Completed processing: ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed`
    );

    return { sentCount, skippedCount, failedCount };
  } catch (error) {
    logger.error('[EmailTriggers] Error in processScheduledEmails:', error);
    return { sentCount: 0, skippedCount: 0, failedCount: 0 };
  }
}

/**
 * Mapea el tipo de trigger al tipo de email correspondiente
 */
function mapTriggerToEmailType(triggerType: string): string {
  const mapping: Record<string, string> = {
    SIGNUP_2H: 'reminder_2h',
    SIGNUP_24H: 'reminder_24h',
    SIGNUP_7D: 'weekly_tips',
    SIGNUP_30D: 'monthly_summary',
  };
  return mapping[triggerType] || 'reminder_24h';
}

/**
 * Cancela todos los emails programados para un usuario
 * (usar cuando el usuario completa el onboarding o se da de baja)
 */
export async function cancelScheduledEmails(userId: string, reason?: string) {
  try {
    const result = await prisma.emailLog.updateMany({
      where: {
        userId,
        status: 'SCHEDULED',
      },
      data: {
        status: 'CANCELLED',
        metadata: { cancelledAt: new Date().toISOString(), reason },
      },
    });

    console.log(
      `[EmailTriggers] Cancelled ${result.count} scheduled emails for user ${userId}`
    );
    return result.count;
  } catch (error) {
    logger.error('[EmailTriggers] Error cancelling emails:', error);
    return 0;
  }
}

/**
 * Programa un email personalizado para un momento específico
 */
export async function scheduleCustomEmail(
  userId: string,
  userEmail: string,
  templateType: string,
  scheduledFor: Date,
  metadata?: Record<string, any>
) {
  try {
    await prisma.emailLog.create({
      data: {
        userId,
        recipientEmail: userEmail,
        templateType,
        status: 'SCHEDULED',
        scheduledFor,
        metadata: metadata || {},
      },
    });

    console.log(
      `[EmailTriggers] Scheduled custom email for user ${userId} at ${scheduledFor.toISOString()}`
    );
    return true;
  } catch (error) {
    logger.error('[EmailTriggers] Error scheduling custom email:', error);
    return false;
  }
}

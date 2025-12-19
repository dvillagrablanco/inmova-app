/**
 * PLANIFICADOR DE EMAILS AUTOMÁTICOS
 * Sistema de triggers y webhooks para envío automatizado
 */

import { prisma } from '@/lib/db';
import { emailService, EMAIL_TEMPLATES } from './email-service';

export enum EmailTrigger {
  USER_REGISTERED = 'user_registered',
  USER_INACTIVE_24H = 'user_inactive_24h',
  USER_INACTIVE_7D = 'user_inactive_7d',
  USER_INACTIVE_14D = 'user_inactive_14d',
  FIRST_BUILDING_CREATED = 'first_building_created',
  FIRST_CONTRACT_CREATED = 'first_contract_created',
  ONBOARDING_COMPLETED = 'onboarding_completed'
}

interface ScheduledEmail {
  userId: string;
  templateId: string;
  scheduledFor: Date;
  trigger: EmailTrigger;
  data?: Record<string, any>;
}

/**
 * Gestor de emails programados
 */
export class EmailScheduler {
  /**
   * Programar un email
   */
  async schedule(email: ScheduledEmail): Promise<void> {
    try {
      // Guardar en base de datos para procesamiento posterior
      await prisma.scheduledEmail.create({
        data: {
          userId: email.userId,
          templateId: email.templateId,
          scheduledFor: email.scheduledFor,
          trigger: email.trigger,
          metadata: email.data || {},
          status: 'pending'
        }
      });

      console.log(`[EMAIL SCHEDULER] Email programado: ${email.templateId} para ${email.scheduledFor}`);
    } catch (error) {
      console.error('[EMAIL SCHEDULER] Error programando email:', error);
    }
  }

  /**
   * Procesar emails pendientes (ejecutar via cron job)
   */
  async processPendingEmails(): Promise<void> {
    try {
      // Obtener emails programados para ahora o antes
      const pendingEmails = await prisma.scheduledEmail.findMany({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: new Date()
          }
        },
        include: {
          user: true
        },
        take: 50 // Procesar en lotes
      });

      console.log(`[EMAIL SCHEDULER] Procesando ${pendingEmails.length} emails pendientes`);

      for (const email of pendingEmails) {
        try {
          // Enviar email según template
          let result;
          
          switch (email.templateId) {
            case 'welcome':
              result = await emailService.sendWelcomeEmail({
                email: email.user.email,
                name: email.user.name || '',
                businessModel: email.metadata?.businessModel
              });
              break;
            
            case 'activation_reminder':
              result = await emailService.sendActivationReminder({
                email: email.user.email,
                name: email.user.name || '',
                businessModel: email.metadata?.businessModel
              });
              break;
            
            case 'first_win':
              result = await emailService.sendFirstWinEmail({
                email: email.user.email,
                name: email.user.name || '',
                achievement: email.metadata?.achievement || 'tu primera propiedad'
              });
              break;
            
            default:
              console.warn(`[EMAIL SCHEDULER] Template desconocido: ${email.templateId}`);
              continue;
          }

          // Actualizar estado
          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: result.success ? 'sent' : 'failed',
              sentAt: result.success ? new Date() : null,
              error: result.error || null
            }
          });

          if (result.success) {
            console.log(`[EMAIL SCHEDULER] ✅ Email enviado: ${email.templateId} a ${email.user.email}`);
          } else {
            console.error(`[EMAIL SCHEDULER] ❌ Error enviando email a ${email.user.email}:`, result.error);
          }

        } catch (error) {
          console.error(`[EMAIL SCHEDULER] Error procesando email ${email.id}:`, error);
          
          // Marcar como fallido
          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: 'failed',
              error: String(error)
            }
          });
        }
      }

      console.log(`[EMAIL SCHEDULER] Procesamiento completado`);
    } catch (error) {
      console.error('[EMAIL SCHEDULER] Error en procesamiento de emails:', error);
    }
  }

  /**
   * Manejar evento: Usuario registrado
   */
  async onUserRegistered(userId: string, userData: any): Promise<void> {
    // Email de bienvenida inmediato
    await this.schedule({
      userId,
      templateId: 'welcome',
      scheduledFor: new Date(), // Inmediato
      trigger: EmailTrigger.USER_REGISTERED,
      data: {
        businessModel: userData.businessModel
      }
    });

    // Email de recordatorio a las 24h (si no vuelve)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    await this.schedule({
      userId,
      templateId: 'activation_reminder',
      scheduledFor: tomorrow,
      trigger: EmailTrigger.USER_INACTIVE_24H
    });

    console.log(`[EMAIL SCHEDULER] Emails programados para nuevo usuario ${userId}`);
  }

  /**
   * Manejar evento: Primera propiedad creada
   */
  async onFirstBuildingCreated(userId: string): Promise<void> {
    await this.schedule({
      userId,
      templateId: 'first_win',
      scheduledFor: new Date(),
      trigger: EmailTrigger.FIRST_BUILDING_CREATED,
      data: {
        achievement: 'tu primera propiedad'
      }
    });

    console.log(`[EMAIL SCHEDULER] Email de felicitación programado para ${userId}`);
  }

  /**
   * Cancelar emails programados de un usuario
   */
  async cancelScheduledEmails(userId: string, templateId?: string): Promise<void> {
    try {
      await prisma.scheduledEmail.updateMany({
        where: {
          userId,
          templateId,
          status: 'pending'
        },
        data: {
          status: 'cancelled'
        }
      });

      console.log(`[EMAIL SCHEDULER] Emails cancelados para usuario ${userId}`);
    } catch (error) {
      console.error('[EMAIL SCHEDULER] Error cancelando emails:', error);
    }
  }
}

// Exportar instancia singleton
export const emailScheduler = new EmailScheduler();

/**
 * ONBOARDING EMAIL AUTOMATION
 * Sistema de emails transaccionales para Zero-Touch Onboarding
 *
 * Features:
 * - Emails automáticos en momentos clave
 * - Templates personalizados por vertical
 * - Tracking de apertura y clics
 * - Reminders inteligentes
 */

import { prisma } from './db';
import logger from '@/lib/logger';
import { sendEmail } from './email-service';

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════

export type EmailTemplate =
  | 'welcome'
  | 'reminder_24h'
  | 'reminder_72h'
  | 'milestone_25'
  | 'milestone_50'
  | 'milestone_75'
  | 'completion'
  | 'abandoned'
  | 'tips_by_vertical'
  | 'help_needed';

interface EmailContext {
  userName: string;
  userEmail: string;
  vertical?: string;
  progress?: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
  };
  lastCompletedStep?: string;
  nextRecommendedStep?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATES DE EMAIL
// ══════════════════════════════════════════════════════════════════════════════

const EMAIL_TEMPLATES = {
  welcome: {
    subject: (ctx: EmailContext) => `¡Bienvenido a INMOVA, ${ctx.userName}! 🎉`,
    html: (ctx: EmailContext) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #111827; 
            margin: 0; 
            padding: 0;
            background: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content { 
            padding: 40px 30px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white !important; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
          }
          .stats { 
            display: flex; 
            justify-content: space-around; 
            margin: 30px 0; 
            text-align: center;
          }
          .stat-number { 
            font-size: 36px; 
            font-weight: 700; 
            color: #667eea; 
            display: block;
          }
          .stat-label { 
            font-size: 14px; 
            color: #6b7280; 
            margin-top: 4px;
          }
          .steps {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
          }
          .step-number {
            width: 32px;
            height: 32px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;
            margin-right: 12px;
          }
          .step-content h4 {
            margin: 0 0 4px 0;
            color: #111827;
            font-size: 16px;
          }
          .step-content p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .stats { flex-direction: column; gap: 20px; }
            .content { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Hola ${ctx.userName}! 👋</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">
              Bienvenido a INMOVA - Tu plataforma PropTech todo-en-uno
            </p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">
              Tu cuenta ha sido creada exitosamente. Estamos emocionados de acompañarte en tu transformación digital.
            </p>
            
            <div class="stats">
              <div>
                <span class="stat-number">88+</span>
                <span class="stat-label">Módulos</span>
              </div>
              <div>
                <span class="stat-number">7</span>
                <span class="stat-label">Verticales</span>
              </div>
              <div>
                <span class="stat-number">24/7</span>
                <span class="stat-label">Soporte IA</span>
              </div>
            </div>
            
            <h3 style="color: #111827; margin-top: 30px;">🚀 Primeros pasos (5 minutos):</h3>
            
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Completa tu perfil</h4>
                  <p>Personaliza tu experiencia según tu negocio</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Crea tu primera propiedad</h4>
                  <p>Usa datos reales o de ejemplo para empezar</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Explora los módulos</h4>
                  <p>Descubre todo lo que puedes hacer</p>
                </div>
              </div>
            </div>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_URL}/onboarding" class="button">
                Empezar Ahora →
              </a>
            </center>
            
            <p style="margin-top: 30px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              💡 <strong>Consejo Pro:</strong> Usa el chatbot IA (esquina inferior derecha) si tienes dudas. ¡Está disponible 24/7!
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              ¿Necesitas ayuda? <a href="${process.env.NEXT_PUBLIC_URL}/soporte">Contáctanos</a> o visita nuestro <a href="${process.env.NEXT_PUBLIC_URL}/docs">Centro de Ayuda</a>
            </p>
            <p style="margin: 10px 0 0 0;">
              © 2025 INMOVA - PropTech All-in-One
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  reminder_24h: {
    subject: (ctx: EmailContext) => `${ctx.userName}, ¿Continuamos donde lo dejaste? 🤔`,
    html: (ctx: EmailContext) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .progress-bar { height: 12px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin: 20px 0; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 999px; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Hola ${ctx.userName}!</h1>
            <p style="margin: 10px 0 0 0;">Veo que empezaste tu configuración. ¡Continuemos! 💪</p>
          </div>
          
          <div class="content">
            <p>Has completado <strong>${ctx.progress?.completedSteps || 0} de ${ctx.progress?.totalSteps || 8} pasos</strong>. ¡Vas por buen camino!</p>
            
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${ctx.progress?.percentage || 0}%;"></div>
            </div>
            
            <p>Solo te quedan <strong>${(ctx.progress?.totalSteps || 8) - (ctx.progress?.completedSteps || 0)} pasos</strong> para tener INMOVA completamente configurado. ¡No te detengas ahora!</p>
            
            ${
              ctx.nextRecommendedStep
                ? `
              <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">📌 Próximo paso recomendado:</h3>
                <p style="margin: 0; font-weight: 600;">${ctx.nextRecommendedStep}</p>
              </div>
            `
                : ''
            }
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_URL}/onboarding" class="button">
                Continuar Configuración →
              </a>
            </center>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
              Recuerda: puedes pausar y volver cuando quieras. Tu progreso está guardado.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© 2025 INMOVA - PropTech All-in-One</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  milestone_50: {
    subject: (ctx: EmailContext) => `🎉 ¡Mitad del camino, ${ctx.userName}!`,
    html: (ctx: EmailContext) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .badge { font-size: 80px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">🎉</div>
            <h1 style="margin: 10px 0;">¡Felicitaciones, ${ctx.userName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Has completado el 50% del onboarding</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; text-align: center;">
              ¡Increíble progreso! Ya has configurado la mitad de tu cuenta INMOVA. 🚀
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #047857;">
                50% Completado
              </p>
              <p style="margin: 10px 0 0 0; color: #065f46;">
                Solo ${(ctx.progress?.totalSteps || 8) - (ctx.progress?.completedSteps || 0)} pasos más para terminar
              </p>
            </div>
            
            <h3 style="color: #111827;">¿Qué has logrado hasta ahora?</h3>
            <ul style="color: #4b5563;">
              <li>✅ Cuenta completamente configurada</li>
              <li>✅ Primeros datos registrados</li>
              <li>✅ Familiarizado con la plataforma</li>
            </ul>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_URL}/onboarding" class="button">
                Completar el otro 50% →
              </a>
            </center>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© 2025 INMOVA - PropTech All-in-One</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  completion: {
    subject: (ctx: EmailContext) =>
      `🎊 ¡Felicitaciones, ${ctx.userName}! Has completado el onboarding`,
    html: (ctx: EmailContext) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .badge { font-size: 100px; margin: 20px 0; }
          .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 30px 0; }
          .feature { background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          @media (max-width: 600px) {
            .feature-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">🏆</div>
            <h1 style="margin: 10px 0;">¡LO LOGRASTE, ${ctx.userName.toUpperCase()}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Onboarding 100% Completado</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; text-align: center;">
              ¡Felicitaciones! Has configurado completamente tu cuenta INMOVA. Ahora estás listo para aprovechar todas las funcionalidades. 🎉
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
              <h2 style="margin: 0 0 10px 0; font-size: 28px;">🚀 ¡Todo Listo!</h2>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                Explora los 88+ módulos de INMOVA y transforma tu gestión inmobiliaria
              </p>
            </div>
            
            <h3 style="color: #111827;">¿Qué puedes hacer ahora?</h3>
            
            <div class="feature-grid">
              <div class="feature">
                <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
                <strong>Dashboard</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                  Monitorea tu negocio en tiempo real
                </p>
              </div>
              
              <div class="feature">
                <div style="font-size: 32px; margin-bottom: 8px;">🤖</div>
                <strong>IA & Automatización</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                  Ahorra tiempo con automatizaciones
                </p>
              </div>
              
              <div class="feature">
                <div style="font-size: 32px; margin-bottom: 8px;">📱</div>
                <strong>Portal Inquilinos</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                  Autogestión total para tus clientes
                </p>
              </div>
              
              <div class="feature">
                <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
                <strong>Contabilidad</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                  Integración contable automática
                </p>
              </div>
            </div>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_URL}/home" class="button">
                Ir al Dashboard →
              </a>
            </center>
            
            <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">💡 Próximo nivel:</h4>
              <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                <li>Explora los módulos avanzados</li>
                <li>Conecta integraciones (Stripe, contabilidad)</li>
                <li>Invita a tu equipo</li>
                <li>Configura automatizaciones</li>
              </ul>
            </div>
            
            <p style="text-align: center; color: #6b7280;">
              ¿Dudas? Nuestro chatbot IA está siempre disponible, o <a href="${process.env.NEXT_PUBLIC_URL}/soporte" style="color: #667eea;">contáctanos directamente</a>.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0; font-weight: 600;">¡Gracias por elegir INMOVA!</p>
            <p style="margin: 0;">© 2025 INMOVA - PropTech All-in-One</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Envía un email de onboarding
 */
export async function sendOnboardingEmail(
  template: EmailTemplate,
  context: EmailContext
): Promise<boolean> {
  try {
    const emailTemplate = EMAIL_TEMPLATES[template];

    if (!emailTemplate) {
      logger.error(`[ONBOARDING_EMAIL] Template not found: ${template}`);
      return false;
    }

    const subject = emailTemplate.subject(context);
    const html = emailTemplate.html(context);

    // Enviar email
    await sendEmail({
      to: context.userEmail,
      subject,
      html,
    });

    logger.info(`[ONBOARDING_EMAIL] Sent ${template} to ${context.userEmail}`);
    return true;
  } catch (error) {
    logger.error(`[ONBOARDING_EMAIL] Failed to send ${template}:`, error);
    return false;
  }
}

/**
 * Procesa reminders automáticos (ejecutar en cron job)
 */
export async function processOnboardingReminders(): Promise<void> {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Reminder 24h: usuarios sin actividad en últimas 24h
    const usersFor24hReminder = await prisma.onboardingProgress.findMany({
      where: {
        completedAt: null,
        lastActivityAt: {
          gte: seventyTwoHoursAgo,
          lte: twentyFourHoursAgo,
        },
        remindersSent: {
          lt: 1,
        },
      },
      include: {
        user: true,
      },
    });

    for (const progress of usersFor24hReminder) {
      const nextStep = await getNextRecommendedStep(progress.userId, progress.companyId);

      await sendOnboardingEmail('reminder_24h', {
        userName: progress.user.name,
        userEmail: progress.user.email,
        vertical: progress.vertical,
        progress: {
          percentage: Math.round((progress.completedSteps.length / progress.totalSteps) * 100),
          completedSteps: progress.completedSteps.length,
          totalSteps: progress.totalSteps,
        },
        nextRecommendedStep: nextStep?.title,
      });

      // Actualizar contador de reminders
      await prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          remindersSent: { increment: 1 },
          emailsSent: { increment: 1 },
        },
      });
    }

    // Reminder 72h: usuarios sin actividad en 72h (abandonados)
    const usersAbandoned = await prisma.onboardingProgress.findMany({
      where: {
        completedAt: null,
        lastActivityAt: {
          lte: seventyTwoHoursAgo,
        },
        abandonedAt: null,
        remindersSent: {
          lt: 3,
        },
      },
      include: {
        user: true,
      },
    });

    for (const progress of usersAbandoned) {
      // Marcar como abandonado
      await prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          abandonedAt: now,
          remindersSent: { increment: 1 },
        },
      });

      // Enviar email especial de recuperación
      await sendOnboardingEmail('reminder_72h', {
        userName: progress.user.name,
        userEmail: progress.user.email,
        vertical: progress.vertical,
        progress: {
          percentage: Math.round((progress.completedSteps.length / progress.totalSteps) * 100),
          completedSteps: progress.completedSteps.length,
          totalSteps: progress.totalSteps,
        },
      });
    }

    logger.info(
      `[ONBOARDING_REMINDERS] Processed ${usersFor24hReminder.length} 24h reminders and ${usersAbandoned.length} abandoned`
    );
  } catch (error) {
    logger.error('[ONBOARDING_REMINDERS] Error processing reminders:', error);
  }
}

/**
 * Procesa hitos de progreso (25%, 50%, 75%, 100%)
 */
export async function checkAndSendMilestoneEmails(
  userId: string,
  companyId: string
): Promise<void> {
  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!progress) return;

    const percentage = Math.round((progress.completedSteps.length / progress.totalSteps) * 100);

    // Verificar hitos
    const milestones = [
      { threshold: 25, template: 'milestone_25' as EmailTemplate },
      { threshold: 50, template: 'milestone_50' as EmailTemplate },
      { threshold: 75, template: 'milestone_75' as EmailTemplate },
      { threshold: 100, template: 'completion' as EmailTemplate },
    ];

    for (const milestone of milestones) {
      if (percentage >= milestone.threshold) {
        // Verificar si ya enviamos este email
        const alreadySent = await prisma.emailLog.findFirst({
          where: {
            userId,
            companyId,
            template: milestone.template,
          },
        });

        if (!alreadySent) {
          await sendOnboardingEmail(milestone.template, {
            userName: progress.user.name,
            userEmail: progress.user.email,
            vertical: progress.vertical,
            progress: {
              percentage,
              completedSteps: progress.completedSteps.length,
              totalSteps: progress.totalSteps,
            },
          });

          // Log del email enviado
          await prisma.emailLog.create({
            data: {
              userId,
              companyId,
              template: milestone.template,
              to: progress.user.email,
              subject: EMAIL_TEMPLATES[milestone.template].subject({
                userName: progress.user.name,
                userEmail: progress.user.email,
                vertical: progress.vertical,
              }),
              status: 'sent',
              sentAt: new Date(),
            },
          });

          // Actualizar contador
          await prisma.onboardingProgress.update({
            where: { id: progress.id },
            data: {
              emailsSent: { increment: 1 },
            },
          });
        }
      }
    }
  } catch (error) {
    logger.error('[MILESTONE_EMAILS] Error:', error);
  }
}

/**
 * Obtiene el próximo paso recomendado
 */
async function getNextRecommendedStep(userId: string, companyId: string) {
  const progress = await prisma.onboardingProgress.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (!progress) return null;

  // Buscar el primer paso no completado
  const nextTask = await prisma.onboardingTask.findFirst({
    where: {
      userId,
      companyId,
      status: 'pending',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return nextTask;
}

/**
 * Envía email de bienvenida al registrarse
 */
export async function sendWelcomeEmail(userId: string, companyId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    await sendOnboardingEmail('welcome', {
      userName: user.name,
      userEmail: user.email,
      vertical: user.businessVertical || undefined,
    });

    // Log del email
    await prisma.emailLog.create({
      data: {
        userId,
        companyId,
        template: 'welcome',
        to: user.email,
        subject: `¡Bienvenido a INMOVA, ${user.name}! 🎉`,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    logger.info(`[WELCOME_EMAIL] Sent to ${user.email}`);
  } catch (error) {
    logger.error('[WELCOME_EMAIL] Error:', error);
  }
}

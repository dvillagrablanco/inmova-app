/**
 * ONBOARDING WEBHOOK SYSTEM
 * Sistema de eventos y webhooks para integrar onboarding con herramientas externas
 * 
 * Compatible con:
 * - Zapier
 * - Make.com (Integromat)
 * - n8n
 * - Slack
 * - Discord
 * - Custom webhooks
 */

import { prisma } from './db';
import logger from '@/lib/logger';
import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS DE EVENTOS
// ══════════════════════════════════════════════════════════════════════════════

export enum OnboardingEventType {
  // Usuario
  USER_REGISTERED = 'user.registered',
  USER_PROFILE_COMPLETED = 'user.profile_completed',
  
  // Onboarding
  ONBOARDING_STARTED = 'onboarding.started',
  ONBOARDING_STEP_STARTED = 'onboarding.step_started',
  ONBOARDING_STEP_COMPLETED = 'onboarding.step_completed',
  ONBOARDING_STEP_SKIPPED = 'onboarding.step_skipped',
  
  // Hitos
  ONBOARDING_MILESTONE_25 = 'onboarding.milestone_25',
  ONBOARDING_MILESTONE_50 = 'onboarding.milestone_50',
  ONBOARDING_MILESTONE_75 = 'onboarding.milestone_75',
  ONBOARDING_COMPLETED = 'onboarding.completed',
  
  // Abandono
  USER_INACTIVE_24H = 'user.inactive_24h',
  USER_INACTIVE_72H = 'user.inactive_72h',
  ONBOARDING_ABANDONED = 'onboarding.abandoned',
  
  // Ayuda
  USER_REQUESTED_HELP = 'user.requested_help',
  CHATBOT_CONVERSATION_STARTED = 'chatbot.conversation_started',
  
  // Acciones clave
  FIRST_BUILDING_CREATED = 'action.first_building_created',
  FIRST_UNIT_CREATED = 'action.first_unit_created',
  FIRST_TENANT_CREATED = 'action.first_tenant_created',
  FIRST_CONTRACT_CREATED = 'action.first_contract_created',
  EXAMPLE_DATA_USED = 'action.example_data_used',
}

export interface WebhookEvent {
  event: OnboardingEventType;
  timestamp: Date;
  userId: string;
  companyId: string;
  data: any;
}

export interface WebhookSubscription {
  id: string;
  companyId: string;
  url: string;
  events: OnboardingEventType[];
  secret: string;
  active: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLICAR EVENTOS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Publica un evento de onboarding
 */
export async function publishOnboardingEvent(event: WebhookEvent): Promise<void> {
  try {
    // 1. Guardar evento en BD para auditoría
    await prisma.webhookEvent.create({
      data: {
        companyId: event.companyId,
        event: event.event,
        payload: event.data as any,
        status: 'pending',
        createdAt: event.timestamp
      }
    });
    
    // 2. Disparar webhooks suscritos
    await triggerWebhooks(event);
    
    // 3. Analytics interno
    await trackAnalyticsEvent(event);
    
    // 4. Triggers automáticos internos
    await handleInternalTriggers(event);
    
    logger.info(`[WEBHOOK_EVENT] Published: ${event.event}`);
  } catch (error) {
    logger.error(`[WEBHOOK_EVENT] Failed to publish ${event.event}:`, error);
  }
}

/**
 * Dispara webhooks configurados
 */
async function triggerWebhooks(event: WebhookEvent): Promise<void> {
  try {
    // Buscar webhooks suscritos a este evento
    const webhooks = await prisma.webhookSubscription.findMany({
      where: {
        companyId: event.companyId,
        active: true,
        events: {
          has: event.event
        }
      }
    });
    
    if (webhooks.length === 0) {
      return; // No hay webhooks suscritos
    }
    
    // Disparar webhooks en paralelo
    await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, event))
    );
  } catch (error) {
    logger.error('[TRIGGER_WEBHOOKS] Error:', error);
  }
}

/**
 * Envía un webhook individual
 */
async function sendWebhook(
  subscription: any,
  event: WebhookEvent
): Promise<void> {
  try {
    const payload = {
      event: event.event,
      timestamp: event.timestamp.toISOString(),
      user_id: event.userId,
      company_id: event.companyId,
      data: event.data
    };
    
    // Generar firma HMAC para verificación
    const signature = generateWebhookSignature(payload, subscription.secret);
    
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.event,
        'X-Webhook-Timestamp': event.timestamp.toISOString(),
        'User-Agent': 'INMOVA-Webhooks/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10s timeout
    });
    
    if (response.ok) {
      // Webhook enviado exitosamente
      await prisma.webhookEvent.updateMany({
        where: {
          companyId: event.companyId,
          event: event.event,
          status: 'pending'
        },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });
      
      logger.info(`[WEBHOOK] Sent ${event.event} to ${subscription.url}`);
    } else {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    logger.error(`[WEBHOOK] Failed to send to ${subscription.url}:`, error);
    
    // Actualizar estado de fallo
    await prisma.webhookEvent.updateMany({
      where: {
        companyId: event.companyId,
        event: event.event,
        status: 'pending'
      },
      data: {
        status: 'failed',
        error: error.message,
        attempts: { increment: 1 }
      }
    });
    
    // Retry logic: si falló menos de 3 veces, reintentar en 5 minutos
    // (esto lo manejaría un cron job separado)
  }
}

/**
 * Genera firma HMAC para webhook
 */
function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

/**
 * Verifica la firma de un webhook (para cuando recibimos webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS INTERNO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Trackea eventos en analytics interno
 */
async function trackAnalyticsEvent(event: WebhookEvent): Promise<void> {
  try {
    // Aquí se integraría con tu sistema de analytics
    // Por ahora, solo registramos en logs estructurados
    
    const analyticsData = {
      event_type: event.event,
      user_id: event.userId,
      company_id: event.companyId,
      timestamp: event.timestamp.toISOString(),
      properties: event.data
    };
    
    // Si tienes Mixpanel, Amplitude, Segment, etc:
    // await mixpanel.track(event.event, analyticsData);
    // await amplitude.logEvent(event.event, analyticsData);
    
    logger.info('[ANALYTICS]', analyticsData);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking event:', error);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TRIGGERS AUTOMÁTICOS INTERNOS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Maneja triggers automáticos basados en eventos
 */
async function handleInternalTriggers(event: WebhookEvent): Promise<void> {
  try {
    switch (event.event) {
      case OnboardingEventType.USER_REGISTERED:
        // Enviar email de bienvenida
        await sendWelcomeEmailTrigger(event);
        break;
      
      case OnboardingEventType.ONBOARDING_MILESTONE_50:
        // Celebración en UI
        await createUserCelebration(event.userId, event.companyId, 'milestone_50');
        break;
      
      case OnboardingEventType.ONBOARDING_COMPLETED:
        // Celebración final + desbloquear features premium trial
        await createUserCelebration(event.userId, event.companyId, 'onboarding_complete');
        await unlockPremiumTrial(event.userId, event.companyId);
        break;
      
      case OnboardingEventType.USER_INACTIVE_72H:
        // Notificar al equipo de CS (Customer Success)
        await notifyCustomerSuccess(event);
        break;
      
      case OnboardingEventType.USER_REQUESTED_HELP:
        // Crear ticket de soporte automáticamente
        await createSupportTicket(event);
        break;
      
      default:
        // No hay trigger específico
        break;
    }
  } catch (error) {
    logger.error('[INTERNAL_TRIGGERS] Error:', error);
  }
}

/**
 * Trigger: Enviar email de bienvenida
 */
async function sendWelcomeEmailTrigger(event: WebhookEvent): Promise<void> {
  // Importamos dinámicamente para evitar dependencias circulares
  const { sendWelcomeEmail } = await import('./onboarding-email-automation');
  await sendWelcomeEmail(event.userId, event.companyId);
}

/**
 * Trigger: Crear celebración para el usuario
 */
async function createUserCelebration(
  userId: string,
  companyId: string,
  type: string
): Promise<void> {
  await prisma.userCelebration.create({
    data: {
      userId,
      companyId,
      type,
      title: getCelebrationTitle(type),
      description: getCelebrationDescription(type),
      icon: getCelebrationIcon(type),
      seen: false,
      createdAt: new Date()
    }
  });
}

function getCelebrationTitle(type: string): string {
  switch (type) {
    case 'milestone_50':
      return '¡Mitad del camino! 🎉';
    case 'onboarding_complete':
      return '¡Onboarding Completado! 🏆';
    default:
      return '¡Felicitaciones!';
  }
}

function getCelebrationDescription(type: string): string {
  switch (type) {
    case 'milestone_50':
      return 'Has completado el 50% de la configuración. ¡Sigue así!';
    case 'onboarding_complete':
      return 'Tu cuenta está 100% configurada. ¡Empieza a disfrutar de INMOVA!';
    default:
      return 'Has alcanzado un hito importante.';
  }
}

function getCelebrationIcon(type: string): string {
  switch (type) {
    case 'milestone_50':
      return '🎉';
    case 'onboarding_complete':
      return '🏆';
    default:
      return '✨';
  }
}

/**
 * Trigger: Desbloquear trial premium
 */
async function unlockPremiumTrial(userId: string, companyId: string): Promise<void> {
  // Dar 90 días de trial premium al completar onboarding
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 90);
  
  await prisma.company.update({
    where: { id: companyId },
    data: {
      premiumTrial: true,
      premiumTrialEnd: trialEnd
    }
  });
  
  logger.info(`[PREMIUM_TRIAL] Unlocked for company ${companyId}`);
}

/**
 * Trigger: Notificar Customer Success
 */
async function notifyCustomerSuccess(event: WebhookEvent): Promise<void> {
  // Enviar a Slack, Discord, o crear ticket interno
  const user = await prisma.user.findUnique({
    where: { id: event.userId },
    include: { company: true }
  });
  
  if (!user) return;
  
  const message = `🚨 Usuario inactivo 72h: ${user.name} (${user.email}) - ${user.company.nombre}`;
  
  // Enviar a Slack (si está configurado)
  if (process.env.SLACK_CS_WEBHOOK_URL) {
    await fetch(process.env.SLACK_CS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Ver Perfil' },
                url: `${process.env.NEXT_PUBLIC_URL}/admin/usuarios/${event.userId}`
              }
            ]
          }
        ]
      })
    });
  }
  
  logger.info('[CS_NOTIFICATION] Sent inactive user alert');
}

/**
 * Trigger: Crear ticket de soporte
 */
async function createSupportTicket(event: WebhookEvent): Promise<void> {
  await prisma.supportTicket.create({
    data: {
      userId: event.userId,
      companyId: event.companyId,
      subject: 'Usuario solicitó ayuda durante onboarding',
      description: `El usuario solicitó ayuda en el paso: ${event.data.stepId || 'desconocido'}`,
      status: 'open',
      priority: 'high',
      category: 'onboarding',
      createdAt: new Date()
    }
  });
  
  logger.info('[SUPPORT_TICKET] Created for user help request');
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS PARA EMITIR EVENTOS FÁCILMENTE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Helper: Usuario completó un step
 */
export async function emitStepCompleted(
  userId: string,
  companyId: string,
  stepId: string,
  stepTitle: string,
  progress: { percentage: number; completedSteps: number; totalSteps: number }
): Promise<void> {
  await publishOnboardingEvent({
    event: OnboardingEventType.ONBOARDING_STEP_COMPLETED,
    timestamp: new Date(),
    userId,
    companyId,
    data: {
      stepId,
      stepTitle,
      percentage: progress.percentage,
      completedSteps: progress.completedSteps,
      totalSteps: progress.totalSteps
    }
  });
  
  // Verificar hitos
  if (progress.percentage >= 25 && progress.percentage < 50) {
    await publishOnboardingEvent({
      event: OnboardingEventType.ONBOARDING_MILESTONE_25,
      timestamp: new Date(),
      userId,
      companyId,
      data: { percentage: 25 }
    });
  } else if (progress.percentage >= 50 && progress.percentage < 75) {
    await publishOnboardingEvent({
      event: OnboardingEventType.ONBOARDING_MILESTONE_50,
      timestamp: new Date(),
      userId,
      companyId,
      data: { percentage: 50 }
    });
  } else if (progress.percentage >= 75 && progress.percentage < 100) {
    await publishOnboardingEvent({
      event: OnboardingEventType.ONBOARDING_MILESTONE_75,
      timestamp: new Date(),
      userId,
      companyId,
      data: { percentage: 75 }
    });
  } else if (progress.percentage === 100) {
    await publishOnboardingEvent({
      event: OnboardingEventType.ONBOARDING_COMPLETED,
      timestamp: new Date(),
      userId,
      companyId,
      data: { completedAt: new Date() }
    });
  }
}

/**
 * Helper: Usuario registrado
 */
export async function emitUserRegistered(
  userId: string,
  companyId: string,
  vertical?: string
): Promise<void> {
  await publishOnboardingEvent({
    event: OnboardingEventType.USER_REGISTERED,
    timestamp: new Date(),
    userId,
    companyId,
    data: { vertical }
  });
}

/**
 * Helper: Usuario solicitó ayuda
 */
export async function emitHelpRequested(
  userId: string,
  companyId: string,
  stepId?: string,
  question?: string
): Promise<void> {
  await publishOnboardingEvent({
    event: OnboardingEventType.USER_REQUESTED_HELP,
    timestamp: new Date(),
    userId,
    companyId,
    data: { stepId, question }
  });
}

/**
 * Helper: Primera acción clave
 */
export async function emitFirstAction(
  userId: string,
  companyId: string,
  action: 'building' | 'unit' | 'tenant' | 'contract',
  entityId: string
): Promise<void> {
  const eventMap = {
    building: OnboardingEventType.FIRST_BUILDING_CREATED,
    unit: OnboardingEventType.FIRST_UNIT_CREATED,
    tenant: OnboardingEventType.FIRST_TENANT_CREATED,
    contract: OnboardingEventType.FIRST_CONTRACT_CREATED
  };
  
  await publishOnboardingEvent({
    event: eventMap[action],
    timestamp: new Date(),
    userId,
    companyId,
    data: { entityId }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// API PARA GESTIONAR SUSCRIPCIONES DE WEBHOOKS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Crea una suscripción de webhook
 */
export async function createWebhookSubscription(
  companyId: string,
  url: string,
  events: OnboardingEventType[]
): Promise<string> {
  // Generar secret único
  const secret = crypto.randomBytes(32).toString('hex');
  
  const subscription = await prisma.webhookSubscription.create({
    data: {
      companyId,
      url,
      events,
      secret,
      active: true
    }
  });
  
  logger.info(`[WEBHOOK_SUBSCRIPTION] Created for ${url}`);
  return secret;
}

/**
 * Lista suscripciones de webhook
 */
export async function listWebhookSubscriptions(companyId: string): Promise<any[]> {
  return await prisma.webhookSubscription.findMany({
    where: { companyId },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true
      // NO devolver el secret por seguridad
    }
  });
}

/**
 * Elimina una suscripción de webhook
 */
export async function deleteWebhookSubscription(id: string): Promise<void> {
  await prisma.webhookSubscription.delete({
    where: { id }
  });
  
  logger.info(`[WEBHOOK_SUBSCRIPTION] Deleted ${id}`);
}

/**
 * Reintentar webhooks fallidos (para cron job)
 */
export async function retryFailedWebhooks(): Promise<void> {
  const failedEvents = await prisma.webhookEvent.findMany({
    where: {
      status: 'failed',
      attempts: {
        lt: 3 // Máximo 3 intentos
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
      }
    },
    take: 100 // Procesar en lotes de 100
  });
  
  for (const event of failedEvents) {
    try {
      await publishOnboardingEvent({
        event: event.event as OnboardingEventType,
        timestamp: event.createdAt,
        userId: event.userId || '',
        companyId: event.companyId,
        data: event.payload
      });
    } catch (error) {
      logger.error('[RETRY_WEBHOOKS] Failed to retry event:', error);
    }
  }
  
  logger.info(`[RETRY_WEBHOOKS] Processed ${failedEvents.length} failed events`);
}

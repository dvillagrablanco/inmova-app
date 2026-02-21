/**
 * Usage Alerts Service
 * 
 * Sistema de alertas automáticas cuando se alcanza el 80% o 100% de uso
 * 
 * Features:
 * - Email automático al 80% de uso
 * - Email automático al 100% (límite alcanzado)
 * - Notificaciones in-app
 * - Rate limiting para evitar spam
 */

import { prisma } from './db';
import { getMonthlyUsage } from './usage-tracking-service';
import nodemailer from 'nodemailer';
import { startOfMonth } from 'date-fns';

import logger from '@/lib/logger';
// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE EMAIL
// ═══════════════════════════════════════════════════════════════

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface UsageAlert {
  companyId: string;
  service: 'signatures' | 'storage' | 'aiTokens' | 'sms';
  threshold: 80 | 100;
  used: number;
  limit: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════════════════
// VERIFICACIÓN DE LÍMITES (Cron Job Diario)
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica el uso de todas las empresas y envía alertas si es necesario
 * Ejecutar diariamente con cron job
 */
export async function checkUsageLimitsForAllCompanies(): Promise<void> {
  console.log('[Usage Alerts] Verificando límites de todas las empresas...');
  
  const companies = await prisma.company.findMany({
    where: {
      activo: true,
      subscriptionPlanId: { not: null },
    },
    include: {
      subscriptionPlan: true,
    },
  });
  
  let alertsSent = 0;
  
  for (const company of companies) {
    try {
      const alerts = await checkCompanyUsage(company.id);
      
      for (const alert of alerts) {
        const shouldSend = await shouldSendAlert(alert);
        
        if (shouldSend) {
          await sendUsageAlert(company, alert);
          await logAlertSent(alert);
          alertsSent++;
        }
      }
    } catch (error) {
      logger.error(`[Usage Alerts] Error checking company ${company.id}:`, error);
    }
  }
  
  console.log(`[Usage Alerts] ${alertsSent} alertas enviadas`);
}

/**
 * Verifica el uso de una empresa específica y retorna alertas necesarias
 */
async function checkCompanyUsage(companyId: string): Promise<UsageAlert[]> {
  const usage = await getMonthlyUsage(companyId);
  const alerts: UsageAlert[] = [];
  
  // Verificar firmas
  if (usage.planSignaturesLimit && usage.planSignaturesLimit > 0) {
    const percentage = Math.round((usage.signaturesUsed / usage.planSignaturesLimit) * 100);
    
    if (percentage >= 100) {
      alerts.push({
        companyId,
        service: 'signatures',
        threshold: 100,
        used: usage.signaturesUsed,
        limit: usage.planSignaturesLimit,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        companyId,
        service: 'signatures',
        threshold: 80,
        used: usage.signaturesUsed,
        limit: usage.planSignaturesLimit,
        percentage,
      });
    }
  }
  
  // Verificar storage
  if (usage.planStorageLimit && usage.planStorageLimit > 0) {
    const percentage = Math.round((usage.storageUsedGB / usage.planStorageLimit) * 100);
    
    if (percentage >= 100) {
      alerts.push({
        companyId,
        service: 'storage',
        threshold: 100,
        used: usage.storageUsedGB,
        limit: usage.planStorageLimit,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        companyId,
        service: 'storage',
        threshold: 80,
        used: usage.storageUsedGB,
        limit: usage.planStorageLimit,
        percentage,
      });
    }
  }
  
  // Verificar IA
  if (usage.planAITokensLimit && usage.planAITokensLimit > 0) {
    const percentage = Math.round((usage.aiTokensUsed / usage.planAITokensLimit) * 100);
    
    if (percentage >= 100) {
      alerts.push({
        companyId,
        service: 'aiTokens',
        threshold: 100,
        used: usage.aiTokensUsed,
        limit: usage.planAITokensLimit,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        companyId,
        service: 'aiTokens',
        threshold: 80,
        used: usage.aiTokensUsed,
        limit: usage.planAITokensLimit,
        percentage,
      });
    }
  }
  
  // Verificar SMS
  if (usage.planSMSLimit && usage.planSMSLimit > 0) {
    const percentage = Math.round((usage.smsUsed / usage.planSMSLimit) * 100);
    
    if (percentage >= 100) {
      alerts.push({
        companyId,
        service: 'sms',
        threshold: 100,
        used: usage.smsUsed,
        limit: usage.planSMSLimit,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        companyId,
        service: 'sms',
        threshold: 80,
        used: usage.smsUsed,
        limit: usage.planSMSLimit,
        percentage,
      });
    }
  }
  
  return alerts;
}

/**
 * Verifica si debe enviar alerta (rate limiting para evitar spam)
 * Solo envía una alerta por servicio/threshold cada 24h
 */
async function shouldSendAlert(alert: UsageAlert): Promise<boolean> {
  const period = startOfMonth(new Date());
  const alertKey = `${alert.companyId}-${alert.service}-${alert.threshold}-${period.toISOString()}`;
  
  // Verificar si ya se envió esta alerta en las últimas 24h
  const existingAlert = await prisma.usageLog.findFirst({
    where: {
      companyId: alert.companyId,
      service: 'alert',
      metric: alertKey,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });
  
  return !existingAlert;
}

/**
 * Registra que se envió una alerta (para rate limiting)
 */
async function logAlertSent(alert: UsageAlert): Promise<void> {
  const period = startOfMonth(new Date());
  const alertKey = `${alert.companyId}-${alert.service}-${alert.threshold}-${period.toISOString()}`;
  
  await prisma.usageLog.create({
    data: {
      companyId: alert.companyId,
      service: 'alert',
      metric: alertKey,
      value: alert.percentage,
      cost: 0,
      period,
      metadata: {
        service: alert.service,
        threshold: alert.threshold,
        used: alert.used,
        limit: alert.limit,
      },
    },
  });
}

/**
 * Envía email de alerta a la empresa
 */
async function sendUsageAlert(company: any, alert: UsageAlert): Promise<void> {
  // Obtener email de contacto
  const contactEmail = company.emailContacto || company.email;
  
  if (!contactEmail) {
    logger.warn(`[Usage Alerts] No contact email for company ${company.id}`);
    return;
  }
  
  const serviceName = getServiceName(alert.service);
  const subject = alert.threshold === 100
    ? `⚠️ Límite alcanzado: ${serviceName}`
    : `📊 Alerta de uso: ${serviceName} al ${alert.threshold}%`;
  
  const html = alert.threshold === 100
    ? getLimitReachedEmailHTML(company, alert, serviceName)
    : getWarningEmailHTML(company, alert, serviceName);
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'inmovaapp@gmail.com',
      to: contactEmail,
      subject,
      html,
    });
    
    console.log(`[Usage Alerts] Email sent to ${contactEmail} for ${alert.service} at ${alert.threshold}%`);
    
    // Crear notificación in-app
    await createInAppNotification(company.id, alert, serviceName);
  } catch (error) {
    logger.error('[Usage Alerts] Error sending email:', error);
  }
}

/**
 * Crea notificación in-app
 */
async function createInAppNotification(
  companyId: string,
  alert: UsageAlert,
  serviceName: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        companyId,
        title: alert.threshold === 100
          ? `Límite alcanzado: ${serviceName}`
          : `Alerta de uso: ${serviceName}`,
        message: alert.threshold === 100
          ? `Has alcanzado el límite mensual de ${serviceName}. Actualiza tu plan para continuar.`
          : `Has usado el ${alert.percentage}% de tu cuota mensual de ${serviceName}.`,
        type: alert.threshold === 100 ? 'error' : 'warning',
        link: '/dashboard/billing',
      },
    });
  } catch (error) {
    logger.error('[Usage Alerts] Error creating notification:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getServiceName(service: string): string {
  const names: Record<string, string> = {
    signatures: 'Firmas Digitales',
    storage: 'Almacenamiento',
    aiTokens: 'IA (Valoraciones y Chat)',
    sms: 'SMS',
  };
  
  return names[service] || service;
}

function getWarningEmailHTML(company: any, alert: UsageAlert, serviceName: string): string {
  const unit = alert.service === 'storage' ? 'GB' : alert.service === 'aiTokens' ? 'tokens' : 'unidades';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .stats { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .progress-bar { background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 15px 0; }
        .progress-fill { background: #f59e0b; height: 100%; line-height: 24px; text-align: center; color: white; font-weight: bold; font-size: 12px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Alerta de Uso</h1>
        </div>
        <div class="content">
          <p>Hola ${company.nombre},</p>
          
          <p>Te informamos que has alcanzado el <strong>${alert.threshold}%</strong> de tu cuota mensual de <strong>${serviceName}</strong>.</p>
          
          <div class="stats">
            <div class="stats-row">
              <span>Usado:</span>
              <strong>${alert.used.toFixed(2)} ${unit}</strong>
            </div>
            <div class="stats-row">
              <span>Límite del plan:</span>
              <strong>${alert.limit.toFixed(2)} ${unit}</strong>
            </div>
            <div class="stats-row">
              <span>Porcentaje usado:</span>
              <strong>${alert.percentage}%</strong>
            </div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${alert.percentage}%">${alert.percentage}%</div>
          </div>
          
          <p><strong>¿Qué significa esto?</strong></p>
          <p>Estás cerca de alcanzar tu límite mensual. Te recomendamos:</p>
          <ul>
            <li>Monitorizar tu uso durante el resto del mes</li>
            <li>Considerar actualizar a un plan superior para evitar interrupciones</li>
            <li>Tu cuota se renovará el próximo mes automáticamente</li>
          </ul>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" class="button">
            Ver Planes y Actualizar
          </a>
        </div>
        <div class="footer">
          <p>Este es un email automático. Si tienes dudas, contacta con inmovaapp@gmail.com</p>
          <p>© ${new Date().getFullYear()} Inmova - Plataforma PropTech</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getLimitReachedEmailHTML(company: any, alert: UsageAlert, serviceName: string): string {
  const unit = alert.service === 'storage' ? 'GB' : alert.service === 'aiTokens' ? 'tokens' : 'unidades';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .stats { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Límite Mensual Alcanzado</h1>
        </div>
        <div class="content">
          <p>Hola ${company.nombre},</p>
          
          <div class="alert-box">
            <strong>⚠️ Has alcanzado el límite mensual de ${serviceName}</strong>
          </div>
          
          <p>No podrás usar esta funcionalidad hasta que:</p>
          <ol>
            <li><strong>Actualices tu plan</strong> a uno superior con más límites, o</li>
            <li>Esperes hasta el <strong>próximo mes</strong> cuando tu cuota se renovará automáticamente</li>
          </ol>
          
          <div class="stats">
            <div class="stats-row">
              <span>Usado este mes:</span>
              <strong>${alert.used.toFixed(2)} ${unit}</strong>
            </div>
            <div class="stats-row">
              <span>Límite actual:</span>
              <strong>${alert.limit.toFixed(2)} ${unit}</strong>
            </div>
          </div>
          
          <p><strong>Te recomendamos actualizar tu plan ahora</strong> para:</p>
          <ul>
            <li>✅ Continuar sin interrupciones</li>
            <li>✅ Obtener más recursos mensuales</li>
            <li>✅ Acceder a funcionalidades premium</li>
          </ul>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" class="button">
            Actualizar Plan Ahora
          </a>
        </div>
        <div class="footer">
          <p>Este es un email automático. Si tienes dudas, contacta con inmovaapp@gmail.com</p>
          <p>© ${new Date().getFullYear()} Inmova - Plataforma PropTech</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * API endpoint para ejecutar el check manualmente (para testing)
 */
export async function runUsageAlertsCheck(): Promise<{ success: boolean; alertsSent: number }> {
  try {
    await checkUsageLimitsForAllCompanies();
    return { success: true, alertsSent: 0 }; // TODO: track actual count
  } catch (error) {
    logger.error('[Usage Alerts] Error running check:', error);
    return { success: false, alertsSent: 0 };
  }
}

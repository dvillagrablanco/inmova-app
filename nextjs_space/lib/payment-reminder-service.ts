/**
 * Servicio de Recordatorios de Pagos Pendientes
 * Sistema de notificaciones progresivas con diferentes tonos
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentReminder {
  paymentId: string;
  daysOverdue: number;
  amount: number;
  stage: 'friendly' | 'firm' | 'urgent' | 'legal';
  priority: 'bajo' | 'medio' | 'alto';
}

/**
 * Detecta pagos pendientes y determina la etapa de recordatorio
 */
export async function detectOverduePayments(companyId?: string): Promise<PaymentReminder[]> {
  const now = new Date();
  
  const paymentWhere: any = {
    estado: 'atrasado',
  };
  
  if (companyId) {
    paymentWhere.contract = {
      tenant: {
        companyId,
      },
    };
  }

  const payments = await prisma.payment.findMany({
    where: paymentWhere,
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  const reminders: PaymentReminder[] = [];

  for (const payment of payments) {
    const daysOverdue = differenceInDays(now, new Date(payment.fechaVencimiento));
    
    let stage: PaymentReminder['stage'];
    let priority: PaymentReminder['priority'];
    
    if (daysOverdue >= 30) {
      stage = 'legal';
      priority = 'alto';
    } else if (daysOverdue >= 15) {
      stage = 'urgent';
      priority = 'alto';
    } else if (daysOverdue >= 7) {
      stage = 'firm';
      priority = 'medio';
    } else if (daysOverdue >= 3) {
      stage = 'friendly';
      priority = 'bajo';
    } else {
      continue; // No enviar recordatorio hasta el día 3
    }

    reminders.push({
      paymentId: payment.id,
      daysOverdue,
      amount: parseFloat(payment.monto.toString()),
      stage,
      priority,
    });
  }

  return reminders;
}

/**
 * Procesa recordatorios de pago y envía notificaciones
 */
export async function processPaymentReminders(companyId?: string): Promise<void> {
  const reminders = await detectOverduePayments(companyId);
  
  for (const reminder of reminders) {
    await processPaymentReminder(reminder);
  }
}

/**
 * Procesa un recordatorio individual
 */
async function processPaymentReminder(reminder: PaymentReminder): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: reminder.paymentId },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  if (!payment || !payment.contract?.unit?.building) return;

  const companyId = payment.contract.unit.building.companyId;
  if (!companyId) return;

  // Verificar si ya existe una notificación reciente
  const daysSinceLastNotification = await getDaysSinceLastPaymentNotification(
    payment.id,
    companyId
  );

  // Solo crear nueva notificación según la etapa
  let shouldCreateNotification = false;
  switch (reminder.stage) {
    case 'friendly':
      shouldCreateNotification = daysSinceLastNotification >= 3;
      break;
    case 'firm':
      shouldCreateNotification = daysSinceLastNotification >= 4;
      break;
    case 'urgent':
      shouldCreateNotification = daysSinceLastNotification >= 3;
      break;
    case 'legal':
      shouldCreateNotification = daysSinceLastNotification >= 5;
      break;
  }

  if (!shouldCreateNotification) return;

  // Crear notificación en el sistema
  await createNotification({
    companyId,
    tipo: 'pago_atrasado',
    titulo: getReminderTitle(reminder, payment),
    mensaje: getReminderMessage(reminder, payment),
    prioridad: reminder.priority,
    entityId: payment.id,
    entityType: 'Payment',
  });

  // Enviar email al inquilino y al administrador
  await sendPaymentReminderEmail(payment, reminder);

  logger.info(`Recordatorio de pago procesado: Pago ${payment.id}, Etapa: ${reminder.stage}`);
}

/**
 * Obtiene días desde la última notificación de pago
 */
async function getDaysSinceLastPaymentNotification(
  paymentId: string,
  companyId: string
): Promise<number> {
  const lastNotification = await prisma.notification.findFirst({
    where: {
      companyId,
      tipo: 'pago_atrasado',
      entityId: paymentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!lastNotification) return 999; // No hay notificación previa

  return differenceInDays(new Date(), new Date(lastNotification.createdAt));
}

/**
 * Genera título del recordatorio según la etapa
 */
function getReminderTitle(reminder: PaymentReminder, payment: any): string {
  const location = `${payment.contract?.unit?.building?.nombre} ${payment.contract?.unit?.numero}`;
  
  switch (reminder.stage) {
    case 'legal':
      return `⚠️ AVISO LEGAL: Pago atrasado ${reminder.daysOverdue} días - ${location}`;
    case 'urgent':
      return `🔴 URGENTE: Pago atrasado ${reminder.daysOverdue} días - ${location}`;
    case 'firm':
      return `📢 Recordatorio: Pago vencido hace ${reminder.daysOverdue} días - ${location}`;
    case 'friendly':
      return `🔔 Recordatorio amistoso: Pago pendiente - ${location}`;
    default:
      return `Recordatorio de pago - ${location}`;
  }
}

/**
 * Genera mensaje detallado según la etapa
 */
function getReminderMessage(reminder: PaymentReminder, payment: any): string {
  const tenantName = payment.contract?.tenant?.nombreCompleto || 'Inquilino';
  const amount = `€${reminder.amount.toLocaleString('es-ES')}`;
  const period = payment.periodo;
  const dueDate = format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy', { locale: es });
  
  let message = `Pago atrasado de ${tenantName}.\n\n`;
  message += `📌 Detalles:\n`;
  message += `• Monto: ${amount}\n`;
  message += `• Período: ${period}\n`;
  message += `• Fecha de vencimiento: ${dueDate}\n`;
  message += `• Días de retraso: ${reminder.daysOverdue}\n\n`;
  
  switch (reminder.stage) {
    case 'legal':
      message += `⚠️ AVISO LEGAL:\n`;
      message += `El pago lleva más de 30 días de retraso. Se recomienda:\n\n`;
      message += `1. 📞 Contacto inmediato con el inquilino\n`;
      message += `2. 📄 Preparar documentación legal\n`;
      message += `3. ⚖️ Considerar iniciar proceso legal\n`;
      message += `4. 💼 Consultar con asesor legal\n\n`;
      message += `Los recargos por mora aplican según contrato.`;
      break;
      
    case 'urgent':
      message += `🔴 ACCIÓN URGENTE REQUERIDA:\n`;
      message += `El pago lleva ${reminder.daysOverdue} días de retraso.\n\n`;
      message += `Acciones inmediatas:\n`;
      message += `1. 📞 Contactar al inquilino HOY\n`;
      message += `2. 📋 Solicitar plan de pago inmediato\n`;
      message += `3. 📄 Documentar todas las comunicaciones\n`;
      message += `4. ⚠️ Advertir sobre posibles acciones legales\n\n`;
      message += `Recargos por mora: ${calculateLateFee(reminder.amount, reminder.daysOverdue)}`;
      break;
      
    case 'firm':
      message += `📢 Recordatorio Formal:\n`;
      message += `Este pago está vencido desde hace ${reminder.daysOverdue} días.\n\n`;
      message += `Por favor, tomar las siguientes acciones:\n`;
      message += `1. 📞 Contactar al inquilino esta semana\n`;
      message += `2. 💳 Solicitar pago inmediato\n`;
      message += `3. 📝 Ofrecer opciones de pago si es necesario\n`;
      message += `4. 📋 Documentar la situación\n\n`;
      message += `Los recargos por mora comenzarán a aplicarse.`;
      break;
      
    case 'friendly':
      message += `🔔 Recordatorio Amistoso:\n`;
      message += `El pago de ${period} está pendiente.\n\n`;
      message += `Acciones sugeridas:\n`;
      message += `1. 📞 Contacto cordial con el inquilino\n`;
      message += `2. 💬 Verificar si hay algún problema\n`;
      message += `3. 🤝 Ofrecer facilidades si es necesario\n`;
      message += `4. 📅 Confirmar fecha de pago\n\n`;
      message += `Mantener buena relación con inquilinos puntuales.`;
      break;
  }
  
  return message;
}

/**
 * Calcula recargo por mora
 */
function calculateLateFee(amount: number, daysOverdue: number): string {
  // 5% + 0.1% por día adicional (ejemplo)
  const baseFee = amount * 0.05;
  const dailyFee = amount * 0.001 * Math.max(0, daysOverdue - 3);
  const totalFee = baseFee + dailyFee;
  return `€${totalFee.toFixed(2)}`;
}

/**
 * Envía email de recordatorio de pago
 */
async function sendPaymentReminderEmail(payment: any, reminder: PaymentReminder): Promise<void> {
  if (!payment.contract?.unit?.building?.companyId) return;

  const tenant = payment.contract.tenant;
  const companyId = payment.contract.unit.building.companyId;

  // Obtener administradores de la empresa
  const admins = await prisma.user.findMany({
    where: {
      companyId,
      role: 'administrador',
    },
  });

  const subject = getReminderTitle(reminder, payment);
  
  // Email para inquilino (si tiene email)
  if (tenant?.email) {
    const tenantHtml = generateTenantEmailHTML(payment, reminder);
    try {
      await sendEmail({
        to: tenant.email,
        subject: `Recordatorio de Pago - ${payment.periodo}`,
        html: tenantHtml,
      });
      logger.info(`Email de recordatorio enviado al inquilino ${tenant.email}`);
    } catch (error) {
      logger.error(`Error enviando email al inquilino:`, error);
    }
  }

  // Email para administradores
  const adminHtml = generateAdminEmailHTML(payment, reminder);
  for (const admin of admins) {
    try {
      await sendEmail({
        to: admin.email,
        subject,
        html: adminHtml,
      });
      logger.info(`Email de alerta enviado a administrador ${admin.email}`);
    } catch (error) {
      logger.error(`Error enviando email a administrador:`, error);
    }
  }
}

/**
 * Genera HTML de email para inquilino
 */
function generateTenantEmailHTML(payment: any, reminder: PaymentReminder): string {
  const amount = `€${reminder.amount.toLocaleString('es-ES')}`;
  const dueDate = format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy', { locale: es });
  const building = payment.contract?.unit?.building?.nombre;
  const unit = payment.contract?.unit?.numero;
  
  let tone = '';
  let urgencyColor = '';
  let actionMessage = '';
  
  switch (reminder.stage) {
    case 'legal':
      tone = 'Aviso Legal';
      urgencyColor = '#dc2626';
      actionMessage = 'Este es un aviso legal formal. Por favor, contacte con nosotros inmediatamente para evitar acciones legales.';
      break;
    case 'urgent':
      tone = 'Urgente';
      urgencyColor = '#ea580c';
      actionMessage = 'Su pago está significativamente atrasado. Le solicitamos que se ponga en contacto con nosotros a la brevedad posible.';
      break;
    case 'firm':
      tone = 'Importante';
      urgencyColor = '#f59e0b';
      actionMessage = 'Hemos notado que su pago está pendiente. Por favor, regularice su situación lo antes posible.';
      break;
    case 'friendly':
      tone = 'Recordatorio';
      urgencyColor = '#3b82f6';
      actionMessage = 'Este es un recordatorio amistoso de su pago pendiente. Si ya realizó el pago, por favor ignore este mensaje.';
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .amount { font-size: 24px; font-weight: bold; color: ${urgencyColor}; }
        .button { background-color: ${urgencyColor}; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; 
                  background-color: white; padding: 15px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 ${tone}: Pago Pendiente</h1>
        </div>
        <div class="content">
          <div class="details">
            <h2>Estimado/a ${payment.contract?.tenant?.nombreCompleto},</h2>
            <p>${actionMessage}</p>
            
            <h3>📋 Detalles del Pago</h3>
            <p><strong>Propiedad:</strong> ${building} - Unidad ${unit}</p>
            <p><strong>Período:</strong> ${payment.periodo}</p>
            <p><strong>Fecha de vencimiento:</strong> ${dueDate}</p>
            <p><strong>Días de atraso:</strong> ${reminder.daysOverdue} días</p>
            <p class="amount">Monto adeudado: ${amount}</p>
            
            ${reminder.stage !== 'friendly' ? `
            <div style="background-color: #fee2e2; padding: 10px; border-radius: 4px; margin-top: 15px;">
              <p><strong>⚠️ Recargo por mora:</strong> ${calculateLateFee(reminder.amount, reminder.daysOverdue)}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="details">
            <h3>💳 Opciones de Pago</h3>
            <p>Por favor, realice el pago a través de su método habitual o contacte con nosotros para coordinar.</p>
            <p><strong>Teléfono:</strong> ${payment.contract?.unit?.building?.telefono || 'Ver contrato'}</p>
            <p><strong>Email:</strong> ${payment.contract?.unit?.building?.email || 'administracion@inmova.com'}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Gracias por su atención.</p>
          <p>Este es un email automático. Para consultas, responda a este correo o contacte con su administrador.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera HTML de email para administrador
 */
function generateAdminEmailHTML(payment: any, reminder: PaymentReminder): string {
  const amount = `€${reminder.amount.toLocaleString('es-ES')}`;
  const dueDate = format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy', { locale: es });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; }
        .alert { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Alerta de Pago Atrasado</h1>
        </div>
        <div class="content">
          <div class="alert">
            <h2>Pago atrasado ${reminder.daysOverdue} días - Etapa: ${reminder.stage}</h2>
          </div>
          
          <div class="details">
            <h3>📋 Información del Pago</h3>
            <p><strong>Inquilino:</strong> ${payment.contract?.tenant?.nombreCompleto}</p>
            <p><strong>Email:</strong> ${payment.contract?.tenant?.email || 'No disponible'}</p>
            <p><strong>Teléfono:</strong> ${payment.contract?.tenant?.telefono || 'No disponible'}</p>
            <p><strong>Propiedad:</strong> ${payment.contract?.unit?.building?.nombre} - ${payment.contract?.unit?.numero}</p>
            <p><strong>Período:</strong> ${payment.periodo}</p>
            <p><strong>Monto:</strong> ${amount}</p>
            <p><strong>Vencimiento:</strong> ${dueDate}</p>
            <p><strong>Días de atraso:</strong> ${reminder.daysOverdue}</p>
            <p><strong>Recargo por mora:</strong> ${calculateLateFee(reminder.amount, reminder.daysOverdue)}</p>
          </div>
          
          <div class="details">
            <h3>✅ Acciones Recomendadas</h3>
            <pre>${getReminderMessage(reminder, payment)}</pre>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/pagos" class="button">Ver Pagos en INMOVA</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera informe de pagos atrasados
 */
export async function generateOverduePaymentsReport(companyId: string): Promise<any> {
  const reminders = await detectOverduePayments(companyId);
  
  const payments = await Promise.all(
    reminders.map(async (reminder) => {
      const payment = await prisma.payment.findUnique({
        where: { id: reminder.paymentId },
        include: {
          contract: {
            include: {
              tenant: true,
              unit: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      });
      return { ...payment, reminder };
    })
  );

  const legal = payments.filter(p => p.reminder.stage === 'legal');
  const urgent = payments.filter(p => p.reminder.stage === 'urgent');
  const firm = payments.filter(p => p.reminder.stage === 'firm');
  const friendly = payments.filter(p => p.reminder.stage === 'friendly');

  const totalOverdue = payments.reduce((sum, p) => sum + p.reminder.amount, 0);

  return {
    total: payments.length,
    totalAmount: totalOverdue,
    legal: legal.length,
    urgent: urgent.length,
    firm: firm.length,
    friendly: friendly.length,
    payments: payments.map(p => ({
      id: p.id,
      tenant: p.contract?.tenant?.nombreCompleto,
      unit: `${p.contract?.unit?.building?.nombre} ${p.contract?.unit?.numero}`,
      period: p.periodo,
      amount: p.reminder.amount,
      daysOverdue: p.reminder.daysOverdue,
      stage: p.reminder.stage,
      priority: p.reminder.priority,
    })),
  };
}

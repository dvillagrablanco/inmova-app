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
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${tone} - Pago Pendiente | INMOVA</title>
      <style>
        /* Reset y estilos base */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #f3f4f6;
        }
        table {
          border-spacing: 0;
          width: 100%;
        }
        td {
          padding: 0;
        }
        img {
          border: 0;
          display: block;
          max-width: 100%;
          height: auto;
        }
        /* Estilos principales */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, ${urgencyColor} 0%, ${reminder.stage === 'legal' ? '#991B1B' : reminder.stage === 'urgent' ? '#DC2626' : reminder.stage === 'formal' ? '#D97706' : '#2563EB'} 100%);
          padding: 40px 32px;
          text-align: center;
        }
        .header-logo {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          margin: 8px 0 0;
          font-weight: 500;
        }
        .content {
          padding: 40px 32px;
        }
        .alert-badge {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
          text-transform: uppercase;
          background: linear-gradient(135deg, ${urgencyColor} 0%, ${reminder.stage === 'legal' ? '#991B1B' : reminder.stage === 'urgent' ? '#DC2626' : reminder.stage === 'formal' ? '#D97706' : '#2563EB'} 100%);
          color: #ffffff;
          ${reminder.stage === 'legal' || reminder.stage === 'urgent' ? 'box-shadow: 0 4px 8px rgba(0,0,0,0.2); animation: pulse 2s infinite;' : ''}
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        h1 {
          color: #111827;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 16px;
          line-height: 1.3;
        }
        h2 {
          color: #1F2937;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px;
        }
        h3 {
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 12px;
        }
        p {
          color: #4B5563;
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 16px;
        }
        .info-box {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
          border-left: 4px solid #4F46E5;
          padding: 24px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .info-row {
          margin-bottom: 12px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 700;
          color: #4F46E5;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1F2937;
          font-size: 16px;
        }
        .amount-box {
          background: linear-gradient(135deg, ${urgencyColor}15 0%, ${urgencyColor}25 100%);
          border: 2px solid ${urgencyColor};
          padding: 24px;
          margin: 24px 0;
          border-radius: 12px;
          text-align: center;
        }
        .amount {
          font-size: 36px;
          font-weight: 800;
          color: ${urgencyColor};
          margin: 8px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          margin-top: 24px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
          transition: all 0.3s ease;
        }
        .warning-box {
          background: linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%);
          border-left: 4px solid #EF4444;
          padding: 20px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .warning-box p {
          color: #991B1B;
          margin: 0;
          font-weight: 500;
        }
        .late-fee-box {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-left: 4px solid #F59E0B;
          padding: 20px;
          margin: 16px 0;
          border-radius: 8px;
        }
        .late-fee-box p {
          color: #78350F;
          margin: 0;
          font-weight: 600;
        }
        .payment-options {
          background-color: #F9FAFB;
          border: 2px dashed #D1D5DB;
          padding: 24px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .footer {
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          padding: 32px;
          text-align: center;
          border-top: 1px solid #E5E7EB;
        }
        .footer-text {
          color: #9CA3AF;
          font-size: 13px;
          line-height: 1.6;
          margin: 8px 0;
        }
        .footer-link {
          color: #A78BFA;
          text-decoration: none;
        }
        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }
        /* Responsive */
        @media only screen and (max-width: 600px) {
          .content { padding: 32px 20px !important; }
          .header { padding: 32px 20px !important; }
          .header-logo { font-size: 28px !important; }
          h1 { font-size: 24px !important; }
          .amount { font-size: 28px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f3f4f6;">
        <tr>
          <td style="padding: 20px 0;">
            <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <!-- Header -->
              <tr>
                <td class="header">
                  <h2 class="header-logo">🏢 INMOVA</h2>
                  <p class="header-subtitle">Gestión Inmobiliaria Inteligente</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content">
                  <div class="alert-badge">${tone.toUpperCase()}</div>
                  
                  <h1>💳 ${tone}: Pago Pendiente</h1>
                  
                  <h2>Estimado/a ${payment.contract?.tenant?.nombreCompleto},</h2>
                  <p>${actionMessage}</p>
                  
                  <div class="amount-box">
                    <p style="color: #6B7280; font-size: 14px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase;">Monto Adeudado</p>
                    <div class="amount">${amount}</div>
                    <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0;">Período: ${payment.periodo}</p>
                  </div>
                  
                  <div class="info-box">
                    <h3 style="margin-top: 0; color: #4F46E5;">📋 Detalles del Pago</h3>
                    <div class="info-row">
                      <span class="info-label">🏠 Propiedad:</span>
                      <span class="info-value">${building} - Unidad ${unit}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">📅 Período:</span>
                      <span class="info-value">${payment.periodo}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">📆 Fecha de vencimiento:</span>
                      <span class="info-value" style="font-weight: 700;">${dueDate}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">⏰ Días de atraso:</span>
                      <span class="info-value" style="font-weight: 700; color: ${urgencyColor};">${reminder.daysOverdue} día${reminder.daysOverdue !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  ${reminder.stage !== 'friendly' ? `
                  <div class="late-fee-box">
                    <p><strong>⚠️ Recargo por mora aplicable:</strong> ${calculateLateFee(reminder.amount, reminder.daysOverdue)}</p>
                    <p style="margin-top: 8px; font-size: 13px; color: #92400E;">Este recargo se añadirá al monto adeudado según los términos del contrato.</p>
                  </div>
                  ` : ''}
                  
                  ${reminder.stage === 'legal' || reminder.stage === 'urgent' ? `
                  <div class="warning-box">
                    <p><strong>⚠️ Acción Inmediata Requerida:</strong> ${reminder.stage === 'legal' ? 'Este pago está significativamente atrasado. Si no se recibe el pago en los próximos días, nos veremos obligados a iniciar procedimientos legales según lo establecido en el contrato.' : 'Este pago está atrasado y requiere su atención inmediata para evitar recargos adicionales.'}</p>
                  </div>
                  ` : ''}
                  
                  <div class="payment-options">
                    <h3 style="margin-top: 0; color: #374151;">💳 Opciones de Pago</h3>
                    <p>Por favor, realice el pago a través de su método habitual o contacte con nosotros para coordinar alternativas de pago:</p>
                    <p style="margin-top: 16px;"><strong>📞 Teléfono:</strong> ${payment.contract?.unit?.building?.telefono || 'Consulte su contrato'}</p>
                    <p><strong>📧 Email:</strong> ${payment.contract?.unit?.building?.email || payment.contract?.unit?.building?.company?.emailContacto || 'administracion@inmova.app'}</p>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://inmova.app'}/pagos" class="button">
                      💳 Ver Mis Pagos en INMOVA
                    </a>
                  </div>
                  
                  <p style="margin-top: 32px; color: #6B7280; font-size: 14px;">
                    Si ya ha realizado este pago, por favor ignore este mensaje y disculpe las molestias. Si tiene alguna duda, no dude en contactarnos.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td class="footer">
                  <div class="footer-logo">INMOVA</div>
                  <p class="footer-text">
                    Gestión Inmobiliaria Inteligente<br>
                    Automatizamos, optimizamos, innovamos
                  </p>
                  <p class="footer-text" style="margin-top: 16px;">
                    Este es un mensaje automático del sistema INMOVA.<br>
                    © ${new Date().getFullYear()} INMOVA. Todos los derechos reservados.
                  </p>
                  <p class="footer-text" style="margin-top: 12px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://inmova.app'}" class="footer-link">Acceder a INMOVA</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
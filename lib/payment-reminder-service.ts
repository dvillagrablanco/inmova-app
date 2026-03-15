/**
 * Servicio de Recordatorios de Pagos Pendientes
 * Sistema de notificaciones progresivas con diferentes tonos
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import { baseTemplate, detailRow } from './email-templates';
import type { CompanyInfo } from './email-templates';
import logger from './logger';
import { format, differenceInDays } from 'date-fns';
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
    contract: {
      metodoPago: { notIn: ['domiciliacion', 'domiciliación'] },
    },
  };

  if (companyId) {
    paymentWhere.contract = {
      ...paymentWhere.contract,
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
              building: {
                include: {
                  company: { select: { id: true, nombre: true, email: true, telefono: true, logoUrl: true, direccion: true, cif: true } },
                },
              },
            },
          },
        },
      },
      sepaPayments: { take: 1 },
    },
  });

  const filteredPayments = payments.filter(p => !(p as any).sepaPayments?.length);

  const reminders: PaymentReminder[] = [];

  for (const payment of filteredPayments) {
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
 * Obtiene la configuración de recordatorios de pago de una empresa
 */
async function getCompanyReminderConfig(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      paymentRemindersEnabled: true,
      paymentRemindersOverdueEnabled: true,
      paymentRemindersSendToTenant: true,
      paymentRemindersSendToAdmin: true,
      paymentRemindersMinDaysOverdue: true,
    },
  });
  return company;
}

/**
 * Procesa recordatorios de pago y envía notificaciones
 */
export async function processPaymentReminders(companyId?: string): Promise<void> {
  if (companyId) {
    const config = await getCompanyReminderConfig(companyId);
    if (config && (!config.paymentRemindersEnabled || !config.paymentRemindersOverdueEnabled)) {
      logger.info(`Recordatorios de pago deshabilitados para empresa ${companyId}`);
      return;
    }
  }

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
              building: {
                include: {
                  company: { select: { id: true, nombre: true, email: true, telefono: true, logoUrl: true, direccion: true, cif: true } },
                },
              },
            },
          },
        },
      },
      sepaPayments: { take: 1 },
    },
  });

  if (!payment || !payment.contract?.unit?.building) return;

  if ((payment as any).sepaPayments?.length > 0 ||
      payment.contract.metodoPago === 'domiciliacion' ||
      payment.contract.metodoPago === 'domiciliación') {
    return;
  }

  const companyId = payment.contract.unit.building.companyId;
  if (!companyId) return;

  const config = await getCompanyReminderConfig(companyId);
  if (config && (!config.paymentRemindersEnabled || !config.paymentRemindersOverdueEnabled)) {
    return;
  }

  if (config && reminder.daysOverdue < config.paymentRemindersMinDaysOverdue) {
    return;
  }

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

  // Enviar email según configuración de la empresa
  const sendToTenant = config?.paymentRemindersSendToTenant ?? true;
  const sendToAdmin = config?.paymentRemindersSendToAdmin ?? true;
  await sendPaymentReminderEmail(payment, reminder, sendToTenant, sendToAdmin);

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
async function sendPaymentReminderEmail(
  payment: any,
  reminder: PaymentReminder,
  sendToTenant: boolean = true,
  sendToAdmin: boolean = true
): Promise<void> {
  if (!payment.contract?.unit?.building?.companyId) return;

  const tenant = payment.contract.tenant;
  const companyId = payment.contract.unit.building.companyId;
  const companyName = payment.contract?.unit?.building?.company?.nombre || 'Su administrador';

  const subject = getReminderTitle(reminder, payment);

  // Email para inquilino (si tiene email y está habilitado)
  if (sendToTenant && tenant?.email) {
    const tenantHtml = generateTenantEmailHTML(payment, reminder);
    try {
      await sendEmail({
        to: tenant.email,
        subject: `${companyName} \u2014 Aviso de pago pendiente \u2014 ${payment.periodo}`,
        html: tenantHtml,
      });
      logger.info(`Email de recordatorio enviado al inquilino ${tenant.email}`);
    } catch (error) {
      logger.error(`Error enviando email al inquilino:`, error);
    }
  }

  // Email para administradores (si está habilitado)
  if (sendToAdmin) {
    const admins = await prisma.user.findMany({
      where: {
        companyId,
        role: 'administrador',
      },
    });

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
}

/**
 * Construye el objeto CompanyInfo a partir de los datos del payment
 */
function getCompanyInfoFromPayment(payment: any): CompanyInfo {
  const c = payment.contract?.unit?.building?.company;
  return {
    nombre: c?.nombre || 'Su administrador',
    email: c?.email || payment.contract?.unit?.building?.email || undefined,
    telefono: c?.telefono || payment.contract?.unit?.building?.telefono || undefined,
    logoUrl: c?.logoUrl || undefined,
    direccion: c?.direccion || undefined,
    cif: c?.cif || undefined,
  };
}

/**
 * Genera HTML de email para inquilino (pago atrasado)
 */
function generateTenantEmailHTML(payment: any, reminder: PaymentReminder): string {
  const dueDate = format(new Date(payment.fechaVencimiento), "d 'de' MMMM 'de' yyyy", { locale: es });
  const building = payment.contract?.unit?.building?.nombre || '';
  const unit = payment.contract?.unit?.numero || '';
  const tenantName = payment.contract?.tenant?.nombreCompleto || '';
  const company = getCompanyInfoFromPayment(payment);

  let intro: string;
  switch (reminder.stage) {
    case 'friendly':
      intro = `nos dirigimos a usted para comunicarle que, seg\u00fan nuestros registros, el pago correspondiente al periodo <strong>${payment.periodo}</strong>, con vencimiento el <strong>${dueDate}</strong>, se encuentra pendiente de abono.`;
      break;
    case 'firm':
      intro = `le escribimos de nuevo en relaci\u00f3n con el pago correspondiente al periodo <strong>${payment.periodo}</strong>, cuyo vencimiento tuvo lugar el <strong>${dueDate}</strong>. Han transcurrido <strong>${reminder.daysOverdue} d\u00edas</strong> desde la fecha l\u00edmite y el importe sigue pendiente de recibir.`;
      break;
    case 'urgent':
      intro = `lamentamos tener que insistir sobre el pago del periodo <strong>${payment.periodo}</strong>, vencido el <strong>${dueDate}</strong>. A d\u00eda de hoy se acumulan <strong>${reminder.daysOverdue} d\u00edas de demora</strong> y es necesario regularizar esta situaci\u00f3n a la mayor brevedad.`;
      break;
    case 'legal':
      intro = `le informamos formalmente de que el pago correspondiente al periodo <strong>${payment.periodo}</strong>, vencido el <strong>${dueDate}</strong>, lleva <strong>${reminder.daysOverdue} d\u00edas pendiente</strong>. De no recibir el abono en los pr\u00f3ximos d\u00edas, nos veremos en la obligaci\u00f3n de iniciar las acciones legales contempladas en su contrato de arrendamiento.`;
      break;
  }

  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Aviso de pago pendiente</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Recordatorio de pago</h2>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Desde <strong>${company.nombre}</strong>, ${intro}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inmueble', `${building} \u2014 Unidad ${unit}`)}
      ${detailRow('Periodo', payment.periodo)}
      ${detailRow('Fecha de vencimiento', dueDate)}
      ${detailRow('D\u00edas transcurridos', `${reminder.daysOverdue} d\u00eda${reminder.daysOverdue !== 1 ? 's' : ''}`)}
      ${detailRow('Importe pendiente', `<strong style="font-size: 16px;">${reminder.amount.toFixed(2)} \u20ac</strong>`, true)}
    </table>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Si ya ha efectuado el pago recientemente, le rogamos que ignore este mensaje. En ocasiones los cruces entre env\u00edos y recepciones de pagos pueden generar comunicaciones innecesarias, y le pedimos disculpas por la molestia.
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      ${reminder.stage === 'friendly' || reminder.stage === 'firm'
        ? 'Si tiene cualquier dificultad o necesita acordar un plan de pago, no dude en ponerse en contacto con nosotros. Estaremos encantados de buscar una soluci\u00f3n conjunta.'
        : 'Le rogamos que se ponga en contacto con nosotros lo antes posible para regularizar esta situaci\u00f3n y evitar posibles recargos o acciones adicionales.'}
    </p>

    <p style="margin-top: 28px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Reciba un cordial saludo,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return baseTemplate(content, company);
}

/**
 * Genera HTML de email para administrador (alerta interna pago atrasado)
 */
function generateAdminEmailHTML(payment: any, reminder: PaymentReminder): string {
  const dueDate = format(new Date(payment.fechaVencimiento), "d 'de' MMMM 'de' yyyy", { locale: es });
  const building = payment.contract?.unit?.building?.nombre || '';
  const unit = payment.contract?.unit?.numero || '';
  const company = getCompanyInfoFromPayment(payment);

  const stageLabel: Record<string, string> = {
    friendly: 'Amistoso (3\u20136 d\u00edas)',
    firm: 'Formal (7\u201314 d\u00edas)',
    urgent: 'Urgente (15\u201329 d\u00edas)',
    legal: 'Pre-legal (30+ d\u00edas)',
  };

  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Alerta interna</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Pago atrasado \u2014 ${stageLabel[reminder.stage] || reminder.stage}</h2>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 24px; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inquilino', payment.contract?.tenant?.nombreCompleto || 'N/A')}
      ${detailRow('Email', payment.contract?.tenant?.email || 'No disponible')}
      ${detailRow('Tel\u00e9fono', payment.contract?.tenant?.telefono || 'No disponible')}
      ${detailRow('Inmueble', `${building} \u2014 Unidad ${unit}`)}
      ${detailRow('Periodo', payment.periodo)}
      ${detailRow('Vencimiento', dueDate)}
      ${detailRow('D\u00edas de atraso', `<strong>${reminder.daysOverdue}</strong>`)}
      ${detailRow('Importe', `<strong style="font-size: 16px;">${reminder.amount.toFixed(2)} \u20ac</strong>`, true)}
    </table>
  `;

  return baseTemplate(content, company);
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

  const legal = payments.filter((p) => p.reminder.stage === 'legal');
  const urgent = payments.filter((p) => p.reminder.stage === 'urgent');
  const firm = payments.filter((p) => p.reminder.stage === 'firm');
  const friendly = payments.filter((p) => p.reminder.stage === 'friendly');

  const totalOverdue = payments.reduce((sum, p) => sum + p.reminder.amount, 0);

  return {
    total: payments.length,
    totalAmount: totalOverdue,
    legal: legal.length,
    urgent: urgent.length,
    firm: firm.length,
    friendly: friendly.length,
    payments: payments.map((p) => ({
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

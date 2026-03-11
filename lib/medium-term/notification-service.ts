// @ts-nocheck
/**
 * SERVICIO DE NOTIFICACIONES AUTOMÁTICAS PARA MEDIA ESTANCIA
 *
 * Sistema de alertas y recordatorios para contratos temporales
 */

import { prisma } from '../db';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

import logger from '@/lib/logger';
// ==========================================
// TIPOS
// ==========================================

export type NotificationType =
  | 'contract_expiring'
  | 'contract_expired'
  | 'inventory_pending'
  | 'checkout_reminder'
  | 'payment_due'
  | 'payment_overdue'
  | 'renewal_available'
  | 'signature_pending'
  | 'signature_completed'
  | 'welcome_message'
  | 'goodbye_message';

export interface NotificationConfig {
  type: NotificationType;
  daysBeforeEvent?: number;
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  recipientRole: 'owner' | 'tenant' | 'both' | 'admin';
  template: {
    subject: string;
    bodyTemplate: string;
    smsTemplate?: string;
  };
  enabled: boolean;
}

export interface NotificationPayload {
  recipientId: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  contractId: string;
  type: NotificationType;
  data: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  channels: {
    email?: { sent: boolean; messageId?: string };
    sms?: { sent: boolean; messageId?: string };
    push?: { sent: boolean };
    inApp?: { created: boolean; id?: string };
  };
}

// ==========================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ==========================================

const NOTIFICATION_CONFIGS: NotificationConfig[] = [
  {
    type: 'contract_expiring',
    daysBeforeEvent: 30,
    channels: ['email', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '📅 Tu contrato vence en {{daysRemaining}} días',
      bodyTemplate: `
Hola {{recipientName}},

Te recordamos que el contrato de arrendamiento para el inmueble en:

📍 {{propertyAddress}}

Vence el {{endDate}} ({{daysRemaining}} días).

{{#if isOwner}}
Si deseas renovar el contrato, puedes hacerlo directamente desde tu panel de control.
{{else}}
Si deseas renovar tu estancia, contacta con el propietario o gestiona la renovación desde tu portal.
{{/if}}

Datos del contrato:
- Inquilino: {{tenantName}}
- Renta mensual: {{rentAmount}}€
- Duración: {{duration}} meses

Accede a tu cuenta para gestionar la renovación:
{{actionUrl}}

Saludos,
El equipo de Inmova
      `,
      smsTemplate:
        'Tu contrato en {{propertyAddress}} vence en {{daysRemaining}} días. Gestiona la renovación en Inmova.',
    },
  },
  {
    type: 'contract_expiring',
    daysBeforeEvent: 15,
    channels: ['email', 'sms', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '⚠️ ¡Atención! Tu contrato vence en 15 días',
      bodyTemplate: `
Hola {{recipientName}},

⚠️ AVISO IMPORTANTE: Tu contrato vence en 15 días.

{{propertyAddress}}
Fecha de fin: {{endDate}}

{{#if isOwner}}
Si el inquilino no ha confirmado la renovación, te recomendamos contactar para acordar la salida o extensión.
{{else}}
Por favor, confirma si deseas renovar o procederás con la salida. Recuerda que debes dejar el inmueble en las condiciones del inventario de entrada.
{{/if}}

Siguiente paso: Confirmar renovación o coordinar salida.

{{actionUrl}}
      `,
      smsTemplate:
        '⚠️ URGENTE: Contrato {{propertyAddress}} vence en 15 días. Confirma renovación o salida.',
    },
  },
  {
    type: 'contract_expiring',
    daysBeforeEvent: 7,
    channels: ['email', 'sms', 'push', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '🚨 ¡Tu contrato vence en 7 días! Acción requerida',
      bodyTemplate: `
Hola {{recipientName}},

🚨 TU CONTRATO VENCE EN 7 DÍAS

Inmueble: {{propertyAddress}}
Fecha de fin: {{endDate}}

Es necesario que confirmes las siguientes acciones:

{{#if isOwner}}
1. ¿Se renovará el contrato? Configura la renovación desde tu panel.
2. ¿El inquilino saldrá? Programa el check-out e inventario de salida.
3. ¿Hay incidencias pendientes? Revísalas antes de la salida.
{{else}}
1. ¿Renovarás tu estancia? Confirma con el propietario.
2. ¿Vas a salir? Prepara la entrega de llaves y limpieza final.
3. ¿Hay algo dañado? Comunícalo antes del inventario de salida.
{{/if}}

ACCIÓN REQUERIDA: {{actionUrl}}

Saludos,
Inmova
      `,
      smsTemplate:
        '🚨 CONTRATO VENCE EN 7 DÍAS. {{propertyAddress}}. Acción requerida. Ingresa a Inmova.',
    },
  },
  {
    type: 'checkout_reminder',
    daysBeforeEvent: 3,
    channels: ['email', 'sms', 'push', 'in_app'],
    recipientRole: 'tenant',
    enabled: true,
    template: {
      subject: '🏠 Recordatorio: Check-out en 3 días',
      bodyTemplate: `
Hola {{recipientName}},

Tu estancia en {{propertyAddress}} finaliza en 3 días ({{endDate}}).

📋 CHECKLIST DE SALIDA:

□ Limpieza general del inmueble
□ Vaciado de pertenencias personales
□ Comprobación de electrodomésticos
□ Lectura de contadores (si aplica)
□ Recogida de correo pendiente
□ Devolución de llaves y mandos

📅 INVENTARIO DE SALIDA:
Se realizará el {{endDate}} a las {{checkoutTime}}.
El propietario/gestor comparará con el inventario de entrada.

💰 FIANZA:
Será devuelta en un plazo máximo de 30 días tras verificar el estado del inmueble.

¿Necesitas reprogramar? Contacta desde tu portal.

{{actionUrl}}
      `,
      smsTemplate: 'Recordatorio: Check-out en 3 días ({{endDate}}). Prepara la entrega. Inmova.',
    },
  },
  {
    type: 'inventory_pending',
    daysBeforeEvent: 1,
    channels: ['email', 'push', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '📝 Inventario programado para mañana',
      bodyTemplate: `
Hola {{recipientName}},

Mañana se realizará el inventario de {{inventoryType}} para:

📍 {{propertyAddress}}
📅 Fecha: {{inventoryDate}}
🕐 Hora: {{inventoryTime}}

{{#if isEntry}}
Recibirás las llaves y se documentará el estado actual del inmueble.
Por favor, ten disponible tu DNI/NIE.
{{else}}
Se comparará el estado actual con el inventario de entrada.
Asegúrate de que el inmueble esté limpio y vacío.
{{/if}}

Si necesitas cambiar la hora, contacta cuanto antes.

{{actionUrl}}
      `,
    },
  },
  {
    type: 'payment_due',
    daysBeforeEvent: 3,
    channels: ['email', 'in_app'],
    recipientRole: 'tenant',
    enabled: true,
    template: {
      subject: '💳 Recordatorio: Pago de renta próximo',
      bodyTemplate: `
Hola {{recipientName}},

Te recordamos que el pago de la renta mensual vence en 3 días:

📍 {{propertyAddress}}
💰 Importe: {{rentAmount}}€
📅 Fecha de vencimiento: {{dueDate}}

Datos de pago:
{{paymentDetails}}

Si ya has realizado el pago, ignora este mensaje.

{{actionUrl}}
      `,
      smsTemplate: 'Recordatorio: Renta de {{rentAmount}}€ vence el {{dueDate}}. Inmova.',
    },
  },
  {
    type: 'payment_overdue',
    daysBeforeEvent: -3, // Después del vencimiento
    channels: ['email', 'sms', 'push', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '⚠️ Pago pendiente - Acción requerida',
      bodyTemplate: `
Hola {{recipientName}},

{{#if isOwner}}
El inquilino {{tenantName}} tiene un pago pendiente:
{{else}}
Tienes un pago pendiente:
{{/if}}

📍 {{propertyAddress}}
💰 Importe: {{rentAmount}}€
📅 Venció el: {{dueDate}}
⚠️ Días de retraso: {{daysOverdue}}

{{#if isOwner}}
Puedes contactar al inquilino o enviar un recordatorio desde tu panel.
{{else}}
Por favor, realiza el pago cuanto antes para evitar recargos.
{{/if}}

{{actionUrl}}
      `,
      smsTemplate:
        '⚠️ Pago pendiente de {{rentAmount}}€. {{daysOverdue}} días de retraso. Contacta Inmova.',
    },
  },
  {
    type: 'renewal_available',
    daysBeforeEvent: 45,
    channels: ['email', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '🔄 Renovación disponible para tu contrato',
      bodyTemplate: `
Hola {{recipientName}},

Tu contrato actual permite renovación y está próximo a vencer:

📍 {{propertyAddress}}
📅 Fin actual: {{endDate}}
🔄 Prórroga disponible: {{renewalMonths}} meses más

{{#if isOwner}}
Beneficios de renovar:
- Evitas período de vacío
- Reduces costes de captación
- Mantienes un inquilino conocido

Configura las condiciones de renovación desde tu panel.
{{else}}
Beneficios de renovar:
- Evitas mudanza
- Mantienes las condiciones
- Proceso simple y rápido

¿Te interesa renovar? Solicítalo desde tu portal.
{{/if}}

{{actionUrl}}
      `,
    },
  },
  {
    type: 'signature_pending',
    daysBeforeEvent: 0,
    channels: ['email', 'push', 'in_app'],
    recipientRole: 'tenant',
    enabled: true,
    template: {
      subject: '✍️ Firma tu contrato de arrendamiento',
      bodyTemplate: `
Hola {{recipientName}},

Tu contrato de arrendamiento está listo para ser firmado:

📍 {{propertyAddress}}
📅 Inicio: {{startDate}}
📅 Fin: {{endDate}}
💰 Renta: {{rentAmount}}€/mes

Puedes firmar digitalmente en cualquier momento desde el enlace:
{{signatureUrl}}

La firma digital tiene plena validez legal.

Saludos,
Inmova
      `,
      smsTemplate:
        'Tu contrato está listo para firmar. Accede a {{signatureUrl}} para firmarlo digitalmente.',
    },
  },
  {
    type: 'signature_completed',
    daysBeforeEvent: 0,
    channels: ['email', 'in_app'],
    recipientRole: 'both',
    enabled: true,
    template: {
      subject: '✅ Contrato firmado correctamente',
      bodyTemplate: `
Hola {{recipientName}},

¡Excelente! El contrato de arrendamiento ha sido firmado por todas las partes:

📍 {{propertyAddress}}
📅 Vigencia: {{startDate}} - {{endDate}}
✅ Estado: Activo

Puedes descargar una copia del contrato firmado desde:
{{downloadUrl}}

Próximos pasos:
1. Inventario de entrada: {{checkInDate}}
2. Entrega de llaves
3. Alta de suministros (si aplica)

{{actionUrl}}
      `,
    },
  },
  {
    type: 'welcome_message',
    daysBeforeEvent: 0,
    channels: ['email'],
    recipientRole: 'tenant',
    enabled: true,
    template: {
      subject: '🏠 ¡Bienvenido a tu nuevo hogar temporal!',
      bodyTemplate: `
Hola {{recipientName}},

¡Bienvenido/a a {{propertyAddress}}!

Información importante de tu estancia:

📅 Período: {{startDate}} - {{endDate}}
💰 Renta mensual: {{rentAmount}}€
📞 Contacto propietario: {{ownerPhone}}

Servicios incluidos:
{{servicesIncluded}}

Información útil del edificio:
{{buildingInfo}}

Números de emergencia:
- Emergencias: 112
- Urgencias médicas: 061
- Bomberos: 080

Si tienes cualquier problema, reporta una incidencia desde tu portal:
{{actionUrl}}

¡Disfruta tu estancia!
Inmova
      `,
    },
  },
  {
    type: 'goodbye_message',
    daysBeforeEvent: 0,
    channels: ['email'],
    recipientRole: 'tenant',
    enabled: true,
    template: {
      subject: '👋 Gracias por tu estancia',
      bodyTemplate: `
Hola {{recipientName}},

Tu estancia en {{propertyAddress}} ha finalizado.

📊 Resumen:
- Duración: {{duration}} meses
- Desde: {{startDate}}
- Hasta: {{endDate}}

💰 Fianza:
Estado: {{depositStatus}}
{{#if depositReturned}}
Cantidad devuelta: {{depositReturnAmount}}€
{{else}}
Se procesará en un plazo máximo de 30 días.
{{/if}}

{{#if incidences}}
Incidencias registradas:
{{incidences}}
{{/if}}

Esperamos que hayas disfrutado tu estancia.
¿Nos dejas una valoración?
{{reviewUrl}}

¡Hasta pronto!
Inmova
      `,
    },
  },
];

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Procesa y envía una notificación
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const config = NOTIFICATION_CONFIGS.find((c) => c.type === payload.type);

  if (!config || !config.enabled) {
    return {
      success: false,
      notificationId: '',
      channels: {},
    };
  }

  // Preparar datos para plantilla
  const templateData = {
    ...payload.data,
    recipientName: payload.recipientName,
  };

  // Renderizar plantillas
  const subject = renderTemplate(config.template.subject, templateData);
  const body = renderTemplate(config.template.bodyTemplate, templateData);
  const smsText = config.template.smsTemplate
    ? renderTemplate(config.template.smsTemplate, templateData)
    : undefined;

  // Crear registro de notificación
  const notification = await prisma.notification.create({
    data: {
      userId: payload.recipientId,
      type: payload.type,
      title: subject,
      message: body.substring(0, 500),
      data: payload.data,
      read: false,
    },
  });

  const result: NotificationResult = {
    success: true,
    notificationId: notification.id,
    channels: {},
  };

  // Enviar por cada canal configurado
  for (const channel of config.channels) {
    try {
      switch (channel) {
        case 'email':
          result.channels.email = await sendEmail({
            to: payload.recipientEmail,
            subject,
            body,
          });
          break;

        case 'sms':
          if (payload.recipientPhone && smsText) {
            result.channels.sms = await sendSMS({
              to: payload.recipientPhone,
              message: smsText,
            });
          }
          break;

        case 'push':
          result.channels.push = await sendPushNotification({
            userId: payload.recipientId,
            title: subject,
            body: body.substring(0, 200),
          });
          break;

        case 'in_app':
          result.channels.inApp = {
            created: true,
            id: notification.id,
          };
          break;
      }
    } catch (error) {
      logger.error(`[Notification] Error sending ${channel}:`, error);
    }
  }

  return result;
}

/**
 * Escanea y procesa notificaciones pendientes
 * (Ejecutar como cron job)
 */
export async function processScheduledNotifications(): Promise<{
  processed: number;
  sent: number;
}> {
  let processed = 0;
  let sent = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Obtener contratos activos de media estancia
  const contracts = await prisma.contract.findMany({
    where: {
      tipoArrendamiento: 'temporada',
      status: { in: ['activo', 'pendiente'] },
    },
    include: {
      unit: { include: { building: true } },
      tenant: true,
      company: true,
    },
  });

  for (const contract of contracts) {
    processed++;

    const daysUntilEnd = differenceInDays(contract.fechaFin, today);
    const propertyAddress = `${contract.unit.direccion}, ${contract.unit.building?.city}`;

    // Verificar cada configuración de notificación
    for (const config of NOTIFICATION_CONFIGS) {
      if (!config.enabled) continue;
      if (config.daysBeforeEvent === undefined) continue;

      // Verificar si es el día correcto para enviar
      if (daysUntilEnd === config.daysBeforeEvent) {
        // Verificar si ya se envió hoy
        const alreadySent = await prisma.notification.findFirst({
          where: {
            type: config.type,
            data: {
              path: ['contractId'],
              equals: contract.id,
            },
            createdAt: {
              gte: today,
            },
          },
        });

        if (alreadySent) continue;

        // Enviar a inquilino
        if (config.recipientRole === 'tenant' || config.recipientRole === 'both') {
          await sendNotification({
            recipientId: contract.tenant.id,
            recipientEmail: contract.tenant.email,
            recipientPhone: contract.tenant.telefono || undefined,
            recipientName: contract.tenant.nombre,
            contractId: contract.id,
            type: config.type,
            data: {
              contractId: contract.id,
              propertyAddress,
              tenantName: contract.tenant.nombre,
              endDate: format(contract.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es }),
              startDate: format(contract.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es }),
              daysRemaining: daysUntilEnd,
              rentAmount: contract.rentaMensual,
              duration: contract.duracionMesesPrevista,
              isOwner: false,
              actionUrl: `${process.env.NEXTAUTH_URL}/portal/contratos/${contract.id}`,
            },
          });
          sent++;
        }

        // Enviar a propietario/admin
        if (config.recipientRole === 'owner' || config.recipientRole === 'both') {
          const company = contract.company;
          if (company) {
            // TODO: Obtener usuarios admin de la empresa
            // Por ahora, log
            console.log(`[Notification] Would send to owner for contract ${contract.id}`);
          }
        }
      }
    }
  }

  return { processed, sent };
}

/**
 * Envía notificación de check-in
 */
export async function sendCheckInNotification(contractId: string): Promise<void> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: { include: { building: true } },
      tenant: true,
    },
  });

  if (!contract) return;

  await sendNotification({
    recipientId: contract.tenant.id,
    recipientEmail: contract.tenant.email,
    recipientPhone: contract.tenant.telefono || undefined,
    recipientName: contract.tenant.nombre,
    contractId,
    type: 'welcome_message',
    data: {
      propertyAddress: `${contract.unit.direccion}, ${contract.unit.building?.city}`,
      startDate: format(contract.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es }),
      endDate: format(contract.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es }),
      rentAmount: contract.rentaMensual,
      servicesIncluded: formatServicesIncluded(contract.serviciosIncluidos as any),
      buildingInfo: contract.unit.building?.descripcion || 'Información no disponible',
      actionUrl: `${process.env.NEXTAUTH_URL}/portal/contratos/${contract.id}`,
    },
  });
}

/**
 * Envía notificación de check-out
 */
export async function sendCheckOutNotification(
  contractId: string,
  depositStatus: 'pending' | 'returned' | 'partial',
  depositReturnAmount?: number
): Promise<void> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: { include: { building: true } },
      tenant: true,
    },
  });

  if (!contract) return;

  await sendNotification({
    recipientId: contract.tenant.id,
    recipientEmail: contract.tenant.email,
    recipientPhone: contract.tenant.telefono || undefined,
    recipientName: contract.tenant.nombre,
    contractId,
    type: 'goodbye_message',
    data: {
      propertyAddress: `${contract.unit.direccion}, ${contract.unit.building?.city}`,
      startDate: format(contract.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es }),
      endDate: format(contract.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es }),
      duration: contract.duracionMesesPrevista,
      depositStatus,
      depositReturned: depositStatus === 'returned' || depositStatus === 'partial',
      depositReturnAmount,
      reviewUrl: `${process.env.NEXTAUTH_URL}/portal/valoraciones/nuevo?contractId=${contract.id}`,
    },
  });
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  // Reemplazar variables simples {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });

  // Procesar condicionales {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });

  return result.trim();
}

function formatServicesIncluded(services: any): string {
  if (!services) return '- No especificados';

  const items = [];
  if (services.wifi) items.push('✓ WiFi');
  if (services.agua) items.push('✓ Agua');
  if (services.luz) items.push('✓ Electricidad');
  if (services.gas) items.push('✓ Gas');
  if (services.calefaccion) items.push('✓ Calefacción');
  if (services.limpieza) items.push(`✓ Limpieza (${services.limpiezaFrecuencia || 'semanal'})`);

  return items.length > 0 ? items.join('\n') : '- No incluidos en la renta';
}

// Funciones de envío (stubs - implementar con servicios reales)
async function sendEmail(params: { to: string; subject: string; body: string }) {
  // TODO: Implementar con nodemailer/AWS SES
  console.log(`[Email] Sending to ${params.to}: ${params.subject}`);
  return { sent: true, messageId: `email-${Date.now()}` };
}

async function sendSMS(params: { to: string; message: string }) {
  // TODO: Implementar con Twilio
  console.log(`[SMS] Sending to ${params.to}: ${params.message.substring(0, 50)}...`);
  return { sent: true, messageId: `sms-${Date.now()}` };
}

async function sendPushNotification(params: { userId: string; title: string; body: string }) {
  // TODO: Implementar con web-push
  console.log(`[Push] Sending to ${params.userId}: ${params.title}`);
  return { sent: true };
}

export default {
  sendNotification,
  processScheduledNotifications,
  sendCheckInNotification,
  sendCheckOutNotification,
  NOTIFICATION_CONFIGS,
};

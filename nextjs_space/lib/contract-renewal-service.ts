/**
 * Servicio de Renovación Automática de Contratos
 * Gestiona alertas, recordatorios y flujos de renovación
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface RenewalAlert {
  contractId: string;
  daysUntilExpiry: number;
  priority: 'alto' | 'medio' | 'bajo';
  stage: 'initial' | 'followup' | 'urgent' | 'critical';
}

/**
 * Detecta contratos que necesitan renovación y genera alertas automáticas
 */
export async function detectContractsForRenewal(companyId?: string): Promise<RenewalAlert[]> {
  const now = new Date();
  const in90Days = addDays(now, 90);
  
  const contractWhere: any = {
    estado: 'activo',
    fechaFin: {
      lte: in90Days,
      gte: now,
    },
  };
  
  if (companyId) {
    contractWhere.tenant = {
      companyId,
    };
  }

  const contracts = await prisma.contract.findMany({
    where: contractWhere,
    include: {
      tenant: true,
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  const alerts: RenewalAlert[] = [];

  for (const contract of contracts) {
    const daysUntilExpiry = differenceInDays(new Date(contract.fechaFin), now);
    
    let stage: RenewalAlert['stage'];
    let priority: RenewalAlert['priority'];
    
    if (daysUntilExpiry <= 15) {
      stage = 'critical';
      priority = 'alto';
    } else if (daysUntilExpiry <= 30) {
      stage = 'urgent';
      priority = 'alto';
    } else if (daysUntilExpiry <= 60) {
      stage = 'followup';
      priority = 'medio';
    } else {
      stage = 'initial';
      priority = 'bajo';
    }

    alerts.push({
      contractId: contract.id,
      daysUntilExpiry,
      priority,
      stage,
    });
  }

  return alerts;
}

/**
 * Procesa alertas de renovación y envía notificaciones/emails
 */
export async function processRenewalAlerts(companyId?: string): Promise<void> {
  const alerts = await detectContractsForRenewal(companyId);
  
  for (const alert of alerts) {
    await processRenewalAlert(alert);
  }
}

/**
 * Procesa una alerta individual de renovación
 */
async function processRenewalAlert(alert: RenewalAlert): Promise<void> {
  const contract = await prisma.contract.findUnique({
    where: { id: alert.contractId },
    include: {
      tenant: true,
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!contract || !contract.unit?.building) return;

  const companyId = contract.unit.building.companyId;
  if (!companyId) return;

  // Verificar si ya existe una notificación reciente para este contrato
  const recentNotification = await prisma.notification.findFirst({
    where: {
      companyId,
      tipo: 'contrato_vencimiento',
      entityId: contract.id,
      leida: false,
      createdAt: {
        gte: addDays(new Date(), -7), // No crear si ya hay una de hace menos de 7 días
      },
    },
  });

  if (recentNotification) return;

  // Crear notificación en el sistema
  await createNotification({
    companyId,
    tipo: 'contrato_vencimiento',
    titulo: getAlertTitle(alert, contract),
    mensaje: getAlertMessage(alert, contract),
    prioridad: alert.priority,
    fechaLimite: contract.fechaFin,
    entityId: contract.id,
    entityType: 'Contract',
  });

  // Enviar email si es urgente o crítico
  if (alert.stage === 'urgent' || alert.stage === 'critical') {
    await sendRenewalEmail(contract, alert);
  }

  logger.info(`Alerta de renovación procesada: Contrato ${contract.id}, Etapa: ${alert.stage}`);
}

/**
 * Genera título de la alerta según la etapa
 */
function getAlertTitle(alert: RenewalAlert, contract: any): string {
  const location = `${contract.unit?.building?.nombre} ${contract.unit?.numero}`;
  
  switch (alert.stage) {
    case 'critical':
      return `⚠️ URGENTE: Contrato vence en ${alert.daysUntilExpiry} días - ${location}`;
    case 'urgent':
      return `🔔 Contrato próximo a vencer - ${location}`;
    case 'followup':
      return `📋 Recordatorio: Renovación de contrato - ${location}`;
    case 'initial':
      return `📅 Planificar renovación de contrato - ${location}`;
    default:
      return `Renovación de contrato - ${location}`;
  }
}

/**
 * Genera mensaje detallado de la alerta
 */
function getAlertMessage(alert: RenewalAlert, contract: any): string {
  const tenantName = contract.tenant?.nombreCompleto || 'Inquilino';
  const expiryDate = format(new Date(contract.fechaFin), 'dd/MM/yyyy', { locale: es });
  const rent = contract.rentaMensual ? `€${contract.rentaMensual.toLocaleString('es-ES')}` : 'N/A';
  
  let message = `El contrato de ${tenantName} vence el ${expiryDate} (en ${alert.daysUntilExpiry} días).\n\n`;
  message += `📌 Detalles:\n`;
  message += `• Renta mensual: ${rent}\n`;
  message += `• Días restantes: ${alert.daysUntilExpiry}\n\n`;
  
  switch (alert.stage) {
    case 'critical':
      message += `⚠️ ACCIÓN INMEDIATA REQUERIDA:\n`;
      message += `• Contactar al inquilino HOY\n`;
      message += `• Confirmar intención de renovación\n`;
      message += `• Iniciar búsqueda de nuevo inquilino si no renueva`;
      break;
    case 'urgent':
      message += `🔔 Acciones recomendadas:\n`;
      message += `• Contactar al inquilino esta semana\n`;
      message += `• Negociar términos de renovación\n`;
      message += `• Preparar documentación necesaria`;
      break;
    case 'followup':
      message += `📋 Próximos pasos:\n`;
      message += `• Evaluar renovación o buscar nuevo inquilino\n`;
      message += `• Revisar condiciones del mercado\n`;
      message += `• Planificar posibles mejoras a la unidad`;
      break;
    case 'initial':
      message += `📅 Recordatorio:\n`;
      message += `• Comenzar planificación de renovación\n`;
      message += `• Evaluar historial del inquilino\n`;
      message += `• Considerar ajuste de renta según mercado`;
      break;
  }
  
  return message;
}

/**
 * Envía email de renovación al administrador
 */
async function sendRenewalEmail(contract: any, alert: RenewalAlert): Promise<void> {
  if (!contract.unit?.building?.companyId) return;

  // Obtener administradores de la empresa
  const admins = await prisma.user.findMany({
    where: {
      companyId: contract.unit.building.companyId,
      role: 'administrador',
    },
  });

  const subject = getAlertTitle(alert, contract);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-box { background-color: ${alert.stage === 'critical' ? '#fee2e2' : '#fef3c7'}; 
                     border-left: 4px solid ${alert.stage === 'critical' ? '#dc2626' : '#f59e0b'}; 
                     padding: 15px; margin: 15px 0; border-radius: 4px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Alerta de Renovación de Contrato</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2>${subject}</h2>
          </div>
          
          <div class="details">
            <h3>📋 Información del Contrato</h3>
            <p><strong>Inquilino:</strong> ${contract.tenant?.nombreCompleto}</p>
            <p><strong>Ubicación:</strong> ${contract.unit?.building?.nombre} - ${contract.unit?.numero}</p>
            <p><strong>Renta mensual:</strong> €${contract.rentaMensual?.toLocaleString('es-ES')}</p>
            <p><strong>Fecha de vencimiento:</strong> ${format(new Date(contract.fechaFin), 'dd/MM/yyyy', { locale: es })}</p>
            <p><strong>Días restantes:</strong> ${alert.daysUntilExpiry} días</p>
          </div>
          
          <div class="details">
            <h3>✅ Acciones Recomendadas</h3>
            <pre>${getAlertMessage(alert, contract)}</pre>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/contratos" class="button">Ver Contrato en INMOVA</a>
          </div>
          
          <div class="footer">
            <p>Este es un email automático del sistema INMOVA.</p>
            <p>No responder a este correo.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  for (const admin of admins) {
    try {
      await sendEmail({
        to: admin.email,
        subject,
        html: htmlContent,
      });
      logger.info(`Email de renovación enviado a ${admin.email}`);
    } catch (error) {
      logger.error(`Error enviando email a ${admin.email}:`, error);
    }
  }
}

/**
 * Genera informe de contratos próximos a vencer
 */
export async function generateRenewalReport(companyId: string): Promise<any> {
  const alerts = await detectContractsForRenewal(companyId);
  
  const contracts = await Promise.all(
    alerts.map(async (alert) => {
      const contract = await prisma.contract.findUnique({
        where: { id: alert.contractId },
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      });
      return { ...contract, alert };
    })
  );

  const critical = contracts.filter(c => c.alert.stage === 'critical');
  const urgent = contracts.filter(c => c.alert.stage === 'urgent');
  const followup = contracts.filter(c => c.alert.stage === 'followup');
  const initial = contracts.filter(c => c.alert.stage === 'initial');

  return {
    total: contracts.length,
    critical: critical.length,
    urgent: urgent.length,
    followup: followup.length,
    initial: initial.length,
    contracts: contracts.map(c => ({
      id: c.id,
      tenant: c.tenant?.nombreCompleto,
      unit: `${c.unit?.building?.nombre} ${c.unit?.numero}`,
      rent: c.rentaMensual,
      expiryDate: c.fechaFin,
      daysUntilExpiry: c.alert.daysUntilExpiry,
      stage: c.alert.stage,
      priority: c.alert.priority,
    })),
  };
}

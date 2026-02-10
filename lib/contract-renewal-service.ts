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
  
  // Variables para el template del email
  const diasRestantes = alert.daysUntilExpiry;
  const etapa = alert.stage;
  
  // Definir badge class según etapa
  let badgeClass = 'alert-badge-normal';
  let etapaTexto = 'INFORMACIÓN';
  
  switch (etapa) {
    case 'critical':
      badgeClass = 'alert-badge-critical';
      etapaTexto = 'URGENTE';
      break;
    case 'urgent':
      badgeClass = 'alert-badge-urgent';
      etapaTexto = 'IMPORTANTE';
      break;
    case 'followup':
      badgeClass = 'alert-badge-followup';
      etapaTexto = 'SEGUIMIENTO';
      break;
    case 'initial':
      badgeClass = 'alert-badge-initial';
      etapaTexto = 'PLANIFICACIÓN';
      break;
  }
  
  // Generar acciones recomendadas según etapa
  let accionesRecomendadas = '';
  switch (etapa) {
    case 'critical':
      accionesRecomendadas = `
        <div class="warning-box" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-left-color: #DC2626;">
          <p style="color: #991B1B;"><strong>⚠️ ACCIÓN INMEDIATA REQUERIDA</strong></p>
          <ul style="color: #991B1B; margin: 12px 0 0 20px;">
            <li>Contactar al inquilino HOY</li>
            <li>Confirmar intención de renovación</li>
            <li>Iniciar búsqueda de nuevo inquilino si no renueva</li>
          </ul>
        </div>
      `;
      break;
    case 'urgent':
      accionesRecomendadas = `
        <div class="warning-box">
          <p><strong>🔔 Acciones Recomendadas</strong></p>
          <ul style="color: #78350F; margin: 12px 0 0 20px;">
            <li>Contactar al inquilino esta semana</li>
            <li>Negociar términos de renovación</li>
            <li>Preparar documentación necesaria</li>
          </ul>
        </div>
      `;
      break;
    case 'followup':
      accionesRecomendadas = `
        <div class="info-box">
          <p><strong>📋 Próximos Pasos</strong></p>
          <ul style="color: #1F2937; margin: 12px 0 0 20px;">
            <li>Evaluar renovación o buscar nuevo inquilino</li>
            <li>Revisar condiciones del mercado</li>
            <li>Planificar posibles mejoras a la unidad</li>
          </ul>
        </div>
      `;
      break;
    case 'initial':
      accionesRecomendadas = `
        <div class="info-box">
          <p><strong>📅 Recordatorio</strong></p>
          <ul style="color: #1F2937; margin: 12px 0 0 20px;">
            <li>Comenzar planificación de renovación</li>
            <li>Evaluar historial del inquilino</li>
            <li>Considerar ajuste de renta según mercado</li>
          </ul>
        </div>
      `;
      break;
  }
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Renovación de Contrato - INMOVA</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
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
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%);
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
          }
          .badge-inicial { background: linear-gradient(135deg, #3B82F6, #2563EB); color: #ffffff; }
          .badge-seguimiento { background: linear-gradient(135deg, #F59E0B, #D97706); color: #ffffff; }
          .badge-urgente { background: linear-gradient(135deg, #EF4444, #DC2626); color: #ffffff; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); }
          .badge-critico { background: linear-gradient(135deg, #DC2626, #991B1B); color: #ffffff; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.4); animation: pulse 2s infinite; }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          h1 {
            color: #111827;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 16px;
            line-height: 1.3;
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
            display: flex;
            margin-bottom: 12px;
            align-items: flex-start;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 700;
            color: #4F46E5;
            min-width: 140px;
            font-size: 14px;
          }
          .info-value {
            color: #1F2937;
            font-size: 14px;
            flex: 1;
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
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(79, 70, 229, 0.4);
          }
          .warning-box {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            border-left: 4px solid #F59E0B;
            padding: 20px;
            margin: 24px 0;
            border-radius: 8px;
          }
          .warning-box p {
            color: #78350F;
            margin: 0;
            font-weight: 500;
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
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
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
                    <div class="alert-badge ${badgeClass}">${etapaTexto.toUpperCase()}</div>
                    
                    <h1>Renovación de Contrato Próxima</h1>
                    
                    <p>Estimado/a,</p>
                    
                    <p>Le informamos que tiene un contrato próximo a vencer que requiere su atención:</p>
                    
                    <div class="info-box">
                      <div class="info-row">
                        <span class="info-label">📋 Contrato:</span>
                        <span class="info-value">#${contract.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">👤 Inquilino:</span>
                        <span class="info-value">${contract.tenant.nombreCompleto}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">🏠 Unidad:</span>
                        <span class="info-value">${contract.unit.numero} - ${contract.unit.building.nombre}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">📅 Fecha de Vencimiento:</span>
                        <span class="info-value" style="font-weight: 700;">${format(contract.fechaFin, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">⏰ Días Restantes:</span>
                        <span class="info-value" style="font-weight: 700; color: ${etapa === 'critical' ? '#DC2626' : etapa === 'urgent' ? '#F59E0B' : '#4F46E5'};">${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">💰 Renta Actual:</span>
                        <span class="info-value">${contract.rentaMensual.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/mes</span>
                      </div>
                    </div>

                    ${accionesRecomendadas}
                    
                    ${etapa === 'critical' || etapa === 'urgent' ? `
                    <div class="warning-box">
                      <p><strong>⚠️ Acción Inmediata Requerida:</strong> Este contrato vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. Es fundamental tomar una decisión lo antes posible para evitar situaciones de incertidumbre legal.</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://inmova.app'}/contratos/${contract.id}" class="button">
                        📋 Ver Contrato en INMOVA
                      </a>
                    </div>
                    
                    <p style="margin-top: 32px; color: #6B7280; font-size: 14px;">
                      Si tiene alguna duda o necesita asistencia, nuestro equipo está disponible para ayudarle.
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

  // Enviar el email
  await sendEmail({
    to: contract.unit.building.company.emailContacto || contract.unit.building.company.email || 'admin@inmova.app',
    subject,
    html: htmlContent
  });
}


/**
 * Genera reporte de renovaciones de contratos
 * Usado por enhanced-report-service
 */
export async function generateRenewalReport(companyId: string): Promise<any> {
  const alerts = await detectContractsForRenewal(companyId);
  
  // Agrupar por etapa
  const grouped = {
    critical: alerts.filter(a => a.stage === 'critical'),
    urgent: alerts.filter(a => a.stage === 'urgent'),
    followup: alerts.filter(a => a.stage === 'followup'),
    initial: alerts.filter(a => a.stage === 'initial'),
  };
  
  // Obtener contratos completos
  const contractIds = alerts.map(a => a.contractId);
  const contracts = await prisma.contract.findMany({
    where: {
      id: { in: contractIds },
      unit: {
        building: {
          companyId,
        },
      },
    },
    include: {
      tenant: true,
      unit: {
        include: {
          building: true,
        },
      },
    },
  });
  
  return {
    summary: {
      total: alerts.length,
      critical: grouped.critical.length,
      urgent: grouped.urgent.length,
      followup: grouped.followup.length,
      initial: grouped.initial.length,
    },
    alerts,
    contracts,
    grouped,
    generatedAt: new Date(),
  };
}
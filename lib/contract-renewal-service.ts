/**
 * SERVICIO DE RENOVACIÓN AUTOMÁTICA DE CONTRATOS
 * 
 * Gestiona el ciclo completo de renovación:
 * 1. Detectar contratos próximos a vencer (90, 60, 30, 15 días)
 * 2. Enviar alertas y recordatorios
 * 3. Generar nuevo contrato con actualización de renta (IPC)
 * 4. Enviar para firma digital
 * 5. Activar nuevo contrato cuando se firma
 * 
 * @module ContractRenewalService
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format, addDays, addYears, addMonths, differenceInDays, startOfMonth } from 'date-fns';
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
    to: contract.unit.building.company.emailContacto!,
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

// ============================================================================
// FLUJO DE RENOVACIÓN AUTOMÁTICA
// ============================================================================

export interface RenewalConfig {
  durationMonths?: number;     // Duración del nuevo contrato (default: 12)
  applyIpcIncrease?: boolean;  // Aplicar incremento IPC
  ipcRate?: number;            // Tasa IPC a aplicar (default: último publicado)
  customRentIncrease?: number; // Incremento personalizado en %
  sendForSignature?: boolean;  // Enviar automáticamente para firma
}

export interface RenewalResult {
  success: boolean;
  originalContractId: string;
  newContractId?: string;
  newRent?: number;
  rentIncreasePercent?: number;
  message: string;
  actions: string[];
}

/**
 * Genera un nuevo contrato de renovación
 */
export async function generateRenewalContract(
  contractId: string,
  config: RenewalConfig = {}
): Promise<RenewalResult> {
  const actions: string[] = [];

  try {
    // 1. Obtener contrato original
    const originalContract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        unit: {
          include: {
            building: {
              include: { company: true },
            },
          },
        },
        clauses: true,
      },
    });

    if (!originalContract) {
      return {
        success: false,
        originalContractId: contractId,
        message: 'Contrato original no encontrado',
        actions,
      };
    }

    // 2. Calcular nueva renta
    const originalRent = Number(originalContract.rentaMensual);
    let newRent = originalRent;
    let rentIncreasePercent = 0;

    if (config.customRentIncrease) {
      // Incremento personalizado
      rentIncreasePercent = config.customRentIncrease;
      newRent = originalRent * (1 + rentIncreasePercent / 100);
      actions.push(`Incremento de renta personalizado: ${rentIncreasePercent}%`);
    } else if (config.applyIpcIncrease !== false) {
      // Obtener último IPC (simulado - en producción conectar con INE)
      const ipcRate = config.ipcRate || await getLatestIpcRate();
      rentIncreasePercent = ipcRate;
      newRent = originalRent * (1 + ipcRate / 100);
      actions.push(`Incremento IPC aplicado: ${ipcRate}%`);
    }

    newRent = Math.round(newRent * 100) / 100; // Redondear a 2 decimales

    // 3. Calcular fechas del nuevo contrato
    const durationMonths = config.durationMonths || 12;
    const newStartDate = addDays(new Date(originalContract.fechaFin), 1);
    const newEndDate = addMonths(newStartDate, durationMonths);

    // 4. Crear nuevo contrato
    const newContract = await prisma.contract.create({
      data: {
        tenantId: originalContract.tenantId,
        unitId: originalContract.unitId,
        
        // Fechas
        fechaInicio: newStartDate,
        fechaFin: newEndDate,
        diaCobro: originalContract.diaCobro,
        
        // Importes
        rentaMensual: newRent,
        deposito: originalContract.deposito,
        
        // Estado
        estado: 'borrador',
        
        // Referencia al contrato original
        contratoAnteriorId: originalContract.id,
        esRenovacion: true,
        incrementoAplicado: rentIncreasePercent,
        
        // Copiar configuración
        tipoContrato: originalContract.tipoContrato,
        duracionMeses: durationMonths,
      },
    });

    actions.push(`Nuevo contrato creado: ${newContract.id}`);

    // 5. Copiar cláusulas del contrato original
    if (originalContract.clauses && originalContract.clauses.length > 0) {
      for (const clause of originalContract.clauses) {
        await prisma.contractClause.create({
          data: {
            contractId: newContract.id,
            titulo: clause.titulo,
            contenido: clause.contenido,
            orden: clause.orden,
            esObligatoria: clause.esObligatoria,
          },
        });
      }
      actions.push(`${originalContract.clauses.length} cláusulas copiadas`);
    }

    // 6. Marcar contrato original como "pendiente_renovacion"
    await prisma.contract.update({
      where: { id: originalContract.id },
      data: {
        contratoRenovacionId: newContract.id,
        estadoRenovacion: 'generado',
      },
    });

    // 7. Crear notificación
    const company = originalContract.unit.building.company;
    await createNotification({
      companyId: company.id,
      tipo: 'contrato_renovacion',
      titulo: '📋 Nuevo contrato de renovación generado',
      mensaje: `Se ha generado el contrato de renovación para ${originalContract.tenant.nombreCompleto}. Nueva renta: ${newRent.toFixed(2)}€/mes (${rentIncreasePercent > 0 ? '+' : ''}${rentIncreasePercent.toFixed(2)}%)`,
      prioridad: 'alta',
      entityId: newContract.id,
      entityType: 'Contract',
      enlace: `/contratos/${newContract.id}`,
    });

    // 8. Enviar para firma si está configurado
    if (config.sendForSignature) {
      try {
        const { initiateContractSignature } = await import('./digital-signature-service');
        await initiateContractSignature({
          contractId: newContract.id,
          companyId: company.id,
          requestedBy: 'system',
        });
        actions.push('Enviado para firma digital');
      } catch (error) {
        logger.warn('No se pudo enviar para firma:', error);
        actions.push('Error al enviar para firma (requiere configuración)');
      }
    }

    logger.info(`✅ Contrato de renovación generado: ${newContract.id}`);

    return {
      success: true,
      originalContractId: contractId,
      newContractId: newContract.id,
      newRent,
      rentIncreasePercent,
      message: 'Contrato de renovación generado correctamente',
      actions,
    };
  } catch (error: any) {
    logger.error('Error generando contrato de renovación:', error);
    return {
      success: false,
      originalContractId: contractId,
      message: `Error: ${error.message}`,
      actions,
    };
  }
}

/**
 * Obtiene la última tasa IPC publicada
 * En producción, esto debería conectar con el INE o similar
 */
async function getLatestIpcRate(): Promise<number> {
  // Intentar obtener de la configuración o usar valor por defecto
  try {
    const config = await prisma.systemConfig.findFirst({
      where: { key: 'latest_ipc_rate' },
    });
    if (config?.value) {
      return parseFloat(config.value);
    }
  } catch {
    // Ignorar error y usar valor por defecto
  }
  
  // Valor por defecto basado en IPC España 2024
  return 2.8;
}

/**
 * Procesa renovaciones automáticas para contratos que vencen pronto
 */
export async function processAutoRenewals(
  companyId?: string,
  daysBeforeExpiry: number = 30
): Promise<{
  processed: number;
  renewed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let renewed = 0;

  try {
    const now = new Date();
    const targetDate = addDays(now, daysBeforeExpiry);

    // Buscar contratos que:
    // - Vencen en los próximos X días
    // - Tienen auto-renovación activada
    // - No tienen ya un contrato de renovación generado
    const where: any = {
      estado: 'activo',
      autoRenovacion: true,
      contratoRenovacionId: null,
      fechaFin: {
        lte: targetDate,
        gte: now,
      },
    };

    if (companyId) {
      where.unit = {
        building: { companyId },
      };
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        tenant: true,
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    processed = contracts.length;

    for (const contract of contracts) {
      try {
        const result = await generateRenewalContract(contract.id, {
          applyIpcIncrease: true,
          sendForSignature: true,
        });

        if (result.success) {
          renewed++;
          
          // Notificar al inquilino
          await sendRenewalProposalEmail(contract, result.newRent!, result.rentIncreasePercent!);
        } else {
          errors.push(`Contrato ${contract.id}: ${result.message}`);
        }
      } catch (error: any) {
        errors.push(`Contrato ${contract.id}: ${error.message}`);
      }
    }

    logger.info(`📋 Auto-renovaciones procesadas: ${renewed}/${processed}`);

    return { processed, renewed, errors };
  } catch (error: any) {
    logger.error('Error en proceso de auto-renovación:', error);
    return { processed: 0, renewed: 0, errors: [error.message] };
  }
}

/**
 * Envía email de propuesta de renovación al inquilino
 */
async function sendRenewalProposalEmail(
  contract: any,
  newRent: number,
  rentIncreasePercent: number
): Promise<void> {
  const tenant = contract.tenant;
  if (!tenant.email) return;

  const oldRent = Number(contract.rentaMensual);
  const increaseAmount = newRent - oldRent;
  const newEndDate = addYears(new Date(contract.fechaFin), 1);

  await sendEmail({
    to: tenant.email,
    subject: '📋 Propuesta de renovación de contrato',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Propuesta de renovación de contrato</h2>
        
        <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
        
        <p>Tu contrato de alquiler está próximo a vencer y queremos ofrecerte la renovación.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Condiciones de renovación</h3>
          <table style="width: 100%;">
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Renta actual:</td>
              <td style="font-weight: bold;">${oldRent.toFixed(2)} €/mes</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Nueva renta:</td>
              <td style="font-weight: bold; color: #1e40af;">${newRent.toFixed(2)} €/mes</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Variación:</td>
              <td>${increaseAmount >= 0 ? '+' : ''}${increaseAmount.toFixed(2)} € (${rentIncreasePercent >= 0 ? '+' : ''}${rentIncreasePercent.toFixed(2)}%)</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Nuevo período:</td>
              <td>Hasta ${format(newEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</td>
            </tr>
          </table>
        </div>
        
        <p>Si estás de acuerdo con las condiciones, recibirás un email con el nuevo contrato para firmar digitalmente.</p>
        
        <p>Si tienes alguna pregunta o deseas negociar las condiciones, contacta con nosotros.</p>
        
        <a href="${process.env.NEXTAUTH_URL}/portal-inquilino/contrato" 
           style="display: inline-block; background-color: #1e40af; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                  font-weight: bold; margin: 20px 0;">
          Ver detalles en mi portal
        </a>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Si no deseas renovar, tu contrato finalizará automáticamente en la fecha de vencimiento.
        </p>
      </div>
    `,
  });

  logger.info(`📧 Propuesta de renovación enviada a ${tenant.email}`);
}

/**
 * Confirma una renovación (cuando el inquilino acepta)
 */
export async function confirmRenewal(
  renewalContractId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const newContract = await prisma.contract.findUnique({
      where: { id: renewalContractId },
      include: {
        contratoAnterior: true,
      },
    });

    if (!newContract || !newContract.esRenovacion) {
      return { success: false, message: 'Contrato de renovación no encontrado' };
    }

    // Actualizar estado del nuevo contrato
    await prisma.contract.update({
      where: { id: renewalContractId },
      data: {
        estado: 'pendiente_firma',
      },
    });

    // Actualizar estado del contrato original
    if (newContract.contratoAnteriorId) {
      await prisma.contract.update({
        where: { id: newContract.contratoAnteriorId },
        data: {
          estadoRenovacion: 'confirmado',
        },
      });
    }

    return { success: true, message: 'Renovación confirmada' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Rechaza una renovación
 */
export async function rejectRenewal(
  renewalContractId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const newContract = await prisma.contract.findUnique({
      where: { id: renewalContractId },
    });

    if (!newContract || !newContract.esRenovacion) {
      return { success: false, message: 'Contrato de renovación no encontrado' };
    }

    // Cancelar el contrato de renovación
    await prisma.contract.update({
      where: { id: renewalContractId },
      data: {
        estado: 'cancelado',
        motivoCancelacion: reason || 'Renovación rechazada por el inquilino',
      },
    });

    // Actualizar estado del contrato original
    if (newContract.contratoAnteriorId) {
      await prisma.contract.update({
        where: { id: newContract.contratoAnteriorId },
        data: {
          estadoRenovacion: 'rechazado',
          contratoRenovacionId: null,
        },
      });
    }

    return { success: true, message: 'Renovación rechazada' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Obtiene estadísticas de renovaciones
 */
export async function getRenewalStats(companyId: string): Promise<{
  pendingRenewals: number;
  confirmedRenewals: number;
  rejectedRenewals: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  avgRentIncrease: number;
}> {
  const now = new Date();
  
  const [pending, confirmed, rejected, exp30, exp60, exp90, renewals] = await Promise.all([
    prisma.contract.count({
      where: {
        esRenovacion: true,
        estado: 'borrador',
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.count({
      where: {
        esRenovacion: true,
        estado: { in: ['pendiente_firma', 'activo'] },
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.count({
      where: {
        esRenovacion: true,
        estado: 'cancelado',
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.count({
      where: {
        estado: 'activo',
        fechaFin: { lte: addDays(now, 30), gte: now },
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.count({
      where: {
        estado: 'activo',
        fechaFin: { lte: addDays(now, 60), gte: now },
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.count({
      where: {
        estado: 'activo',
        fechaFin: { lte: addDays(now, 90), gte: now },
        unit: { building: { companyId } },
      },
    }),
    prisma.contract.findMany({
      where: {
        esRenovacion: true,
        incrementoAplicado: { not: null },
        unit: { building: { companyId } },
      },
      select: { incrementoAplicado: true },
    }),
  ]);

  const avgIncrease = renewals.length > 0
    ? renewals.reduce((sum, r) => sum + (r.incrementoAplicado || 0), 0) / renewals.length
    : 0;

  return {
    pendingRenewals: pending,
    confirmedRenewals: confirmed,
    rejectedRenewals: rejected,
    expiringIn30Days: exp30,
    expiringIn60Days: exp60,
    expiringIn90Days: exp90,
    avgRentIncrease: Math.round(avgIncrease * 100) / 100,
  };
}
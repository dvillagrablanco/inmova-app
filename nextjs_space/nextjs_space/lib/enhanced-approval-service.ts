/**
 * Servicio Ampliado de Flujos de Aprobación
 * Sistema de aprobaciones múltiples niveles y tipos
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Tipos de solicitudes que pueden requerir aprobación
 */
export type ApprovalType =
  | 'gasto'
  | 'mantenimiento'
  | 'contrato'
  | 'renovacion'
  | 'descuento'
  | 'reembolso'
  | 'inversion'
  | 'mejora';

/**
 * Niveles de aprobación
 */
export type ApprovalLevel = 'operador' | 'supervisor' | 'administrador' | 'director';

/**
 * Configuración de reglas de aprobación
 */
interface ApprovalRule {
  type: ApprovalType;
  minAmount?: number;
  maxAmount?: number;
  requiredLevels: ApprovalLevel[];
  requireAllLevels: boolean; // true = todos deben aprobar, false = cualquiera puede aprobar
  autoApprove?: boolean;
}

/**
 * Reglas de aprobación por defecto
 */
const DEFAULT_APPROVAL_RULES: ApprovalRule[] = [
  // Gastos
  {
    type: 'gasto',
    maxAmount: 500,
    requiredLevels: ['supervisor'],
    requireAllLevels: false,
  },
  {
    type: 'gasto',
    minAmount: 500,
    maxAmount: 2000,
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  {
    type: 'gasto',
    minAmount: 2000,
    requiredLevels: ['administrador', 'director'],
    requireAllLevels: true,
  },
  // Mantenimiento
  {
    type: 'mantenimiento',
    maxAmount: 1000,
    requiredLevels: ['supervisor'],
    requireAllLevels: false,
  },
  {
    type: 'mantenimiento',
    minAmount: 1000,
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  // Contratos
  {
    type: 'contrato',
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  // Renovaciones
  {
    type: 'renovacion',
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  // Descuentos
  {
    type: 'descuento',
    maxAmount: 200,
    requiredLevels: ['supervisor'],
    requireAllLevels: false,
  },
  {
    type: 'descuento',
    minAmount: 200,
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  // Reembolsos
  {
    type: 'reembolso',
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  // Inversiones
  {
    type: 'inversion',
    minAmount: 5000,
    requiredLevels: ['administrador', 'director'],
    requireAllLevels: true,
  },
  // Mejoras
  {
    type: 'mejora',
    maxAmount: 3000,
    requiredLevels: ['administrador'],
    requireAllLevels: false,
  },
  {
    type: 'mejora',
    minAmount: 3000,
    requiredLevels: ['administrador', 'director'],
    requireAllLevels: true,
  },
];

/**
 * Interfaz para solicitud de aprobación
 */
interface ApprovalRequest {
  companyId: string;
  type: ApprovalType;
  title: string;
  description: string;
  amount?: number;
  requestedBy: string;
  entityId?: string;
  entityType?: string;
  metadata?: any;
}

/**
 * Determina los niveles de aprobación requeridos según el tipo y monto
 */
export function getRequiredApprovalLevels(
  type: ApprovalType,
  amount?: number
): ApprovalLevel[] {
  const applicableRules = DEFAULT_APPROVAL_RULES.filter(rule => {
    if (rule.type !== type) return false;
    if (amount === undefined) return true;
    if (rule.minAmount !== undefined && amount < rule.minAmount) return false;
    if (rule.maxAmount !== undefined && amount > rule.maxAmount) return false;
    return true;
  });

  if (applicableRules.length === 0) {
    // Si no hay reglas, por defecto requiere administrador
    return ['administrador'];
  }

  // Obtener todos los niveles requeridos
  const levels = new Set<ApprovalLevel>();
  applicableRules.forEach(rule => {
    rule.requiredLevels.forEach(level => levels.add(level));
  });

  return Array.from(levels);
}

/**
 * Crea una solicitud de aprobación
 */
export async function createApprovalRequest(
  request: ApprovalRequest
): Promise<any> {
  const requiredLevels = getRequiredApprovalLevels(request.type, request.amount);

  // Crear solicitud de aprobación en la base de datos
  const approval = await prisma.approval.create({
    data: {
      tipo: request.type,
      titulo: request.title,
      descripcion: request.description,
      monto: request.amount,
      solicitadoPor: request.requestedBy,
      fechaSolicitud: new Date(),
      estado: 'pendiente',
      entityId: request.entityId,
      entityType: request.entityType,
      metadata: request.metadata,
    } as any,
  });

  // Crear notificación para aprobadores
  await notifyApprovers(
    request.companyId,
    approval.id,
    requiredLevels,
    request.title,
    request.description
  );

  logger.info(
    `Solicitud de aprobación creada: ${approval.id}, Tipo: ${request.type}, Niveles requeridos: ${requiredLevels.join(', ')}`
  );

  return approval;
}

/**
 * Notifica a los aprobadores
 */
async function notifyApprovers(
  companyId: string,
  approvalId: string,
  requiredLevels: ApprovalLevel[],
  title: string,
  description: string
): Promise<void> {
  // Obtener usuarios con roles de aprobación
  const approvers = await prisma.user.findMany({
    where: {
      companyId,
      role: {
        in: requiredLevels as any[],
      },
    },
  });

  // Crear notificaciones
  for (const approver of approvers) {
    await createNotification({
      companyId,
      tipo: 'aprobacion_pendiente',
      titulo: `📋 Nueva solicitud de aprobación: ${title}`,
      mensaje: `${description}\n\nPor favor, revise y apruebe o rechace esta solicitud.`,
      prioridad: 'medio',
      entityId: approvalId,
      entityType: 'Approval',
      userId: approver.id,
    });

    // Enviar email
    try {
      await sendEmail({
        to: approver.email,
        subject: `Nueva solicitud de aprobación: ${title}`,
        html: generateApprovalEmailHTML(title, description, approvalId),
      });
    } catch (error) {
      logger.error(`Error enviando email de aprobación a ${approver.email}:`, error);
    }
  }
}

/**
 * Genera HTML para email de aprobación
 */
function generateApprovalEmailHTML(
  title: string,
  description: string,
  approvalId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
        .button.reject { background-color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Nueva Solicitud de Aprobación</h1>
        </div>
        <div class="content">
          <div class="details">
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin/aprobaciones" class="button">Ver Solicitud</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Procesa aprobación o rechazo
 */
export async function processApprovalDecision(
  approvalId: string,
  userId: string,
  decision: 'aprobar' | 'rechazar',
  comments?: string
): Promise<any> {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Solicitud de aprobación no encontrada');
  }

  if (approval.estado !== 'pendiente') {
    throw new Error('Esta solicitud ya fue procesada');
  }

  // Actualizar solicitud
  const updatedApproval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      estado: decision === 'aprobar' ? 'aprobado' : 'rechazado',
      revisadoPor: userId,
      fechaRevision: new Date(),
      comentarioRechazo: decision === 'rechazar' ? comments : undefined,
    } as any,
  });

  // Notificar al solicitante
  await notifyRequestor(approval, decision, comments);

  logger.info(
    `Solicitud de aprobación ${decision === 'aprobar' ? 'aprobada' : 'rechazada'}: ${approvalId}`
  );

  return updatedApproval;
}

/**
 * Notifica al solicitante sobre la decisión
 */
async function notifyRequestor(
  approval: any,
  decision: 'aprobar' | 'rechazar',
  comments?: string
): Promise<void> {
  const requestor = await prisma.user.findUnique({
    where: { id: approval.solicitadoPor },
  });

  if (!requestor) return;

  const isApproved = decision === 'aprobar';
  const title = isApproved
    ? `✅ Solicitud aprobada: ${approval.titulo}`
    : `❌ Solicitud rechazada: ${approval.titulo}`;

  const message = isApproved
    ? `Su solicitud "${approval.titulo}" ha sido aprobada.`
    : `Su solicitud "${approval.titulo}" ha sido rechazada.${comments ? ` Motivo: ${comments}` : ''}`;

  // Crear notificación
  await createNotification({
    companyId: requestor.companyId as string,
    tipo: isApproved ? 'aprobacion_aprobada' : 'aprobacion_rechazada',
    titulo: title,
    mensaje: message,
    prioridad: 'medio',
    entityId: approval.id,
    entityType: 'Approval',
    userId: requestor.id,
  });

  // Enviar email
  try {
    await sendEmail({
      to: requestor.email,
      subject: title,
      html: generateDecisionEmailHTML(approval, decision, comments),
    });
  } catch (error) {
    logger.error(`Error enviando email de decisión a ${requestor.email}:`, error);
  }
}

/**
 * Genera HTML para email de decisión
 */
function generateDecisionEmailHTML(
  approval: any,
  decision: 'aprobar' | 'rechazar',
  comments?: string
): string {
  const isApproved = decision === 'aprobar';
  const color = isApproved ? '#10b981' : '#dc2626';
  const icon = isApproved ? '✅' : '❌';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${icon} Solicitud ${isApproved ? 'Aprobada' : 'Rechazada'}</h1>
        </div>
        <div class="content">
          <div class="details">
            <h2>${approval.titulo}</h2>
            <p><strong>Estado:</strong> ${isApproved ? 'Aprobada' : 'Rechazada'}</p>
            <p><strong>Fecha:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            ${comments ? `<p><strong>Comentarios:</strong> ${comments}</p>` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin/aprobaciones" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Ver Detalles</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Obtiene estadísticas de aprobaciones
 */
export async function getApprovalStats(companyId: string): Promise<any> {
  const approvals = await prisma.approval.findMany({
    where: {
      // Filtrar por empresa a través de las relaciones
    },
  });

  const total = approvals.length;
  const pending = approvals.filter(a => a.estado === 'pendiente').length;
  const approved = approvals.filter(a => a.estado === 'aprobado').length;
  const rejected = approvals.filter(a => a.estado === 'rechazado').length;

  const byType: { [key: string]: number } = {};
  approvals.forEach(a => {
    byType[a.tipo] = (byType[a.tipo] || 0) + 1;
  });

  return {
    total,
    pending,
    approved,
    rejected,
    approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0',
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
  };
}

/**
 * Solicita aprobación para un gasto
 */
export async function requestExpenseApproval(
  companyId: string,
  expenseId: string,
  requestedBy: string
): Promise<any> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      building: true,
      unit: {
        include: {
          building: true,
        },
      },
      provider: true,
    },
  });

  if (!expense) {
    throw new Error('Gasto no encontrado');
  }

  const amount = parseFloat(expense.monto.toString());
  const location = expense.building?.nombre ||
    `${expense.unit?.building?.nombre} - ${expense.unit?.numero}` ||
    'Sin ubicación';

  return createApprovalRequest({
    companyId,
    type: 'gasto',
    title: `Gasto: ${expense.concepto} - ${location}`,
    description: `Proveedor: ${expense.provider?.nombre || 'Sin proveedor'}\nMonto: €${amount.toLocaleString('es-ES')}${expense.notas ? `\nNotas: ${expense.notas}` : ''}`,
    amount,
    requestedBy,
    entityId: expenseId,
    entityType: 'Expense',
  });
}

/**
 * Solicita aprobación para un mantenimiento
 */
export async function requestMaintenanceApproval(
  companyId: string,
  maintenanceId: string,
  requestedBy: string
): Promise<any> {
  const maintenance = await prisma.maintenanceRequest.findUnique({
    where: { id: maintenanceId },
    include: {
      unit: {
        include: {
          building: true,
        },
      },
      provider: true,
    },
  });

  if (!maintenance) {
    throw new Error('Mantenimiento no encontrado');
  }

  const amount = maintenance.costoEstimado
    ? parseFloat(maintenance.costoEstimado.toString())
    : undefined;
  const location = `${maintenance.unit?.building?.nombre} - ${maintenance.unit?.numero}`;

  return createApprovalRequest({
    companyId,
    type: 'mantenimiento',
    title: `Mantenimiento: ${maintenance.descripcion} - ${location}`,
    description: `Prioridad: ${maintenance.prioridad}\nProveedor: ${maintenance.provider?.nombre || 'Sin asignar'}${amount ? `\nCosto estimado: €${amount.toLocaleString('es-ES')}` : ''}`,
    amount,
    requestedBy,
    entityId: maintenanceId,
    entityType: 'MaintenanceRequest',
  });
}

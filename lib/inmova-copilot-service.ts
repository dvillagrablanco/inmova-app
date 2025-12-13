/**
 * INMOVA COPILOT SERVICE
 * Asistente Proactivo con IA para notificaciones inteligentes y sugerencias
 */

import { prisma } from './db';
import { format, addDays, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export type CopilotNotificationType = 
  | 'payment_reminder' // Recordatorio de pago
  | 'contract_expiring' // Contrato próximo a vencer
  | 'maintenance_due' // Mantenimiento pendiente
  | 'document_missing' // Documento faltante
  | 'budget_alert' // Alerta de presupuesto
  | 'opportunity' // Oportunidad de negocio
  | 'task_overdue' // Tarea vencida
  | 'occupancy_low' // Ocupación baja
  | 'price_suggestion' // Sugerencia de precio
  | 'renewal_opportunity'; // Oportunidad de renovación

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface CopilotNotification {
  id: string;
  type: CopilotNotificationType;
  priority: Priority;
  title: string;
  message: string;
  actionable: boolean;
  actions?: CopilotAction[];
  relatedEntity?: {
    type: 'contract' | 'payment' | 'maintenance' | 'project' | 'unit';
    id: string;
    name: string;
  };
  createdAt: Date;
  readAt?: Date;
}

export interface CopilotAction {
  label: string;
  action: string; // URL o acción a ejecutar
  type: 'primary' | 'secondary';
}

export interface CopilotInsights {
  summary: string;
  kpis: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    good: boolean;
  }[];
  recommendations: string[];
  notifications: CopilotNotification[];
}

/**
 * Genera insights y notificaciones proactivas
 */
export async function generateCopilotInsights(
  companyId: string
): Promise<CopilotInsights> {
  const notifications: CopilotNotification[] = [];
  
  // 1. Verificar pagos pendientes
  const paymentNotifications = await checkPendingPayments(companyId);
  notifications.push(...paymentNotifications);
  
  // 2. Verificar contratos por vencer
  const contractNotifications = await checkExpiringContracts(companyId);
  notifications.push(...contractNotifications);
  
  // 3. Verificar mantenimientos pendientes
  const maintenanceNotifications = await checkMaintenanceDue(companyId);
  notifications.push(...maintenanceNotifications);
  
  // 4. Verificar ocupación
  const occupancyNotifications = await checkOccupancyRates(companyId);
  notifications.push(...occupancyNotifications);
  
  // 5. Sugerencias de precios
  const pricingNotifications = await checkPricingOpportunities(companyId);
  notifications.push(...pricingNotifications);
  
  // Ordenar por prioridad
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Generar KPIs
  const kpis = await generateKPIs(companyId);
  
  // Generar recomendaciones
  const recommendations = generateRecommendations(notifications, kpis);
  
  // Generar resumen
  const summary = generateSummary(notifications, kpis);
  
  return {
    summary,
    kpis,
    recommendations,
    notifications,
  };
}

/**
 * Verifica pagos pendientes próximos a vencer
 */
async function checkPendingPayments(companyId: string): Promise<CopilotNotification[]> {
  const notifications: CopilotNotification[] = [];
  
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          building: {
            companyId,
          },
        },
      },
      estado: 'pendiente',
      fechaVencimiento: {
        lte: addDays(new Date(), 7), // Próximos 7 días
      },
    },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: true,
        },
      },
    },
    take: 10,
  });
  
  payments.forEach(payment => {
    const daysUntilDue = differenceInDays(payment.fechaVencimiento, new Date());
    const isOverdue = daysUntilDue < 0;
    
    let priority: Priority = 'medium';
    if (isOverdue) {
      priority = 'urgent';
    } else if (daysUntilDue <= 1) {
      priority = 'high';
    }
    
    notifications.push({
      id: `payment_${payment.id}`,
      type: 'payment_reminder',
      priority,
      title: isOverdue 
        ? `Pago vencido - ${payment.contract?.tenant?.nombreCompleto}`
        : `Pago próximo a vencer - ${payment.contract?.tenant?.nombreCompleto}`,
      message: `Pago de €${payment.monto} ${isOverdue ? 'vencido hace' : 'vence en'} ${Math.abs(daysUntilDue)} días`,
      actionable: true,
      actions: [
        {
          label: 'Ver Detalles',
          action: `/pagos/${payment.id}`,
          type: 'primary',
        },
        {
          label: 'Enviar Recordatorio',
          action: `/api/payments/${payment.id}/remind`,
          type: 'secondary',
        },
      ],
      relatedEntity: {
        type: 'payment',
        id: payment.id,
        name: `Pago - ${payment.contract?.unit?.numero || 'Unidad'}`,
      },
      createdAt: new Date(),
    });
  });
  
  return notifications;
}

/**
 * Verifica contratos próximos a vencer
 */
async function checkExpiringContracts(companyId: string): Promise<CopilotNotification[]> {
  const notifications: CopilotNotification[] = [];
  
  const contracts = await prisma.contract.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: 'activo',
      fechaFin: {
        gte: new Date(),
        lte: addDays(new Date(), 60), // Próximos 60 días
      },
    },
    include: {
      tenant: true,
      unit: true,
    },
    take: 10,
  });
  
  contracts.forEach(contract => {
    const daysUntilEnd = differenceInDays(contract.fechaFin, new Date());
    
    let priority: Priority = 'low';
    if (daysUntilEnd <= 30) {
      priority = 'high';
    } else if (daysUntilEnd <= 45) {
      priority = 'medium';
    }
    
    notifications.push({
      id: `contract_${contract.id}`,
      type: 'contract_expiring',
      priority,
      title: `Contrato vence en ${daysUntilEnd} días`,
      message: `Contrato de ${contract.tenant?.nombreCompleto} en unidad ${contract.unit?.numero} vence el ${format(contract.fechaFin, 'dd/MM/yyyy')}`,
      actionable: true,
      actions: [
        {
          label: 'Renovar Contrato',
          action: `/contratos/${contract.id}/renovar`,
          type: 'primary',
        },
        {
          label: 'Contactar Inquilino',
          action: `/inquilinos/${contract.tenantId}`,
          type: 'secondary',
        },
      ],
      relatedEntity: {
        type: 'contract',
        id: contract.id,
        name: contract.unit?.numero || 'Unidad',
      },
      createdAt: new Date(),
    });
  });
  
  return notifications;
}

/**
 * Verifica mantenimientos pendientes
 */
async function checkMaintenanceDue(companyId: string): Promise<CopilotNotification[]> {
  const notifications: CopilotNotification[] = [];
  
  const maintenances = await prisma.maintenanceRequest.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: {
        in: ['pendiente', 'en_progreso'],
      },
      fechaProgramada: {
        lte: addDays(new Date(), 3),
      },
    },
    include: {
      unit: true,
    },
    take: 10,
  });
  
  maintenances.forEach(maintenance => {
    const isOverdue = maintenance.fechaProgramada ? isPast(maintenance.fechaProgramada) : false;
    
    notifications.push({
      id: `maintenance_${maintenance.id}`,
      type: 'maintenance_due',
      priority: isOverdue ? 'urgent' : 'high',
      title: isOverdue ? 'Mantenimiento atrasado' : 'Mantenimiento pendiente',
      message: `${maintenance.titulo}${maintenance.unit ? ` en unidad ${maintenance.unit.numero}` : ''}`,
      actionable: true,
      actions: [
        {
          label: 'Ver Detalles',
          action: `/mantenimiento/${maintenance.id}`,
          type: 'primary',
        },
      ],
      relatedEntity: {
        type: 'maintenance',
        id: maintenance.id,
        name: maintenance.titulo,
      },
      createdAt: new Date(),
    });
  });
  
  return notifications;
}

/**
 * Verifica tasas de ocupación bajas
 */
async function checkOccupancyRates(companyId: string): Promise<CopilotNotification[]> {
  const notifications: CopilotNotification[] = [];
  
  // Calcular ocupación
  const totalUnits = await prisma.unit.count({ 
    where: { 
      building: {
        companyId,
      },
    },
  });
  const occupiedUnits = await prisma.unit.count({
    where: {
      building: {
        companyId,
      },
      contracts: {
        some: {
          estado: 'activo',
        },
      },
    },
  });
  
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  if (occupancyRate < 70) {
    notifications.push({
      id: 'occupancy_low',
      type: 'occupancy_low',
      priority: occupancyRate < 50 ? 'high' : 'medium',
      title: 'Tasa de ocupación baja',
      message: `La ocupación actual es del ${occupancyRate.toFixed(1)}%. Considera revisar precios o estrategias de marketing.`,
      actionable: true,
      actions: [
        {
          label: 'Ver Unidades Disponibles',
          action: '/unidades?estado=disponible',
          type: 'primary',
        },
      ],
      createdAt: new Date(),
    });
  }
  
  return notifications;
}

/**
 * Verifica oportunidades de ajuste de precios
 */
async function checkPricingOpportunities(companyId: string): Promise<CopilotNotification[]> {
  const notifications: CopilotNotification[] = [];
  
  // Aquí podrías implementar lógica de análisis de mercado
  // Por ahora, ejemplo simple
  
  return notifications;
}

/**
 * Genera KPIs principales
 */
async function generateKPIs(companyId: string) {
  const totalUnits = await prisma.unit.count({ 
    where: { 
      building: {
        companyId,
      },
    },
  });
  const occupiedUnits = await prisma.unit.count({
    where: {
      building: {
        companyId,
      },
      contracts: { some: { estado: 'activo' } },
    },
  });
  
  const pendingPayments = await prisma.payment.count({
    where: {
      contract: {
        unit: {
          building: {
            companyId,
          },
        },
      },
      estado: 'pendiente',
    },
  });
  
  const activeContracts = await prisma.contract.count({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: 'activo',
    },
  });
  
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  return [
    {
      label: 'Tasa de Ocupación',
      value: `${occupancyRate.toFixed(1)}%`,
      trend: occupancyRate > 80 ? 'up' as const : occupancyRate < 60 ? 'down' as const : 'neutral' as const,
      good: occupancyRate > 70,
    },
    {
      label: 'Contratos Activos',
      value: activeContracts.toString(),
      good: true,
    },
    {
      label: 'Pagos Pendientes',
      value: pendingPayments.toString(),
      trend: pendingPayments > 5 ? 'down' as const : 'neutral' as const,
      good: pendingPayments < 5,
    },
  ];
}

/**
 * Genera recomendaciones basadas en notificaciones y KPIs
 */
function generateRecommendations(notifications: CopilotNotification[], kpis: any[]): string[] {
  const recommendations: string[] = [];
  
  // Recomendaciones basadas en notificaciones urgentes
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;
  if (urgentCount > 0) {
    recommendations.push(`⚠️ Tienes ${urgentCount} notificaciones urgentes que requieren atención inmediata`);
  }
  
  // Recomendaciones basadas en KPIs
  const occupancyKPI = kpis.find(k => k.label === 'Tasa de Ocupación');
  if (occupancyKPI && !occupancyKPI.good) {
    recommendations.push('📉 Considera ajustar precios o mejorar el marketing para aumentar la ocupación');
  }
  
  const paymentsKPI = kpis.find(k => k.label === 'Pagos Pendientes');
  if (paymentsKPI && !paymentsKPI.good) {
    recommendations.push('💳 Revisa los pagos pendientes y envía recordatorios a los inquilinos');
  }
  
  // Recomendaciones generales
  const expiringContracts = notifications.filter(n => n.type === 'contract_expiring').length;
  if (expiringContracts > 3) {
    recommendations.push(`📝 Planifica la renovación de ${expiringContracts} contratos que vencen próximamente`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Todo está funcionando correctamente. Mantén el buen trabajo!');
  }
  
  return recommendations;
}

/**
 * Genera resumen ejecutivo
 */
function generateSummary(notifications: CopilotNotification[], kpis: any[]): string {
  const urgent = notifications.filter(n => n.priority === 'urgent').length;
  const high = notifications.filter(n => n.priority === 'high').length;
  
  if (urgent > 0) {
    return `Tienes ${urgent} notificaciones urgentes y ${high} de alta prioridad que requieren tu atención.`;
  } else if (high > 0) {
    return `Tienes ${high} notificaciones de alta prioridad para revisar.`;
  } else if (notifications.length > 0) {
    return `Tienes ${notifications.length} notificaciones pendientes.`;
  } else {
    return 'Todo está al día. No hay notificaciones pendientes.';
  }
}

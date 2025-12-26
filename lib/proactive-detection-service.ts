/**
 * Servicio de Detección Proactiva de Problemas
 * Monitorea el sistema y detecta problemas automáticamente
 */

import { prisma } from './db';
import { addDays, differenceInDays, isBefore } from 'date-fns';

export interface DetectedIssue {
  id: string;
  type:
    | 'contract_expiring'
    | 'payment_overdue'
    | 'maintenance_overdue'
    | 'low_occupancy'
    | 'missing_data'
    | 'document_missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEntity: {
    type: string;
    id: string;
    name: string;
  };
  suggestedAction: string;
  actionUrl?: string;
  detectedAt: Date;
}

export interface SystemHealthReport {
  overallScore: number; // 0-100
  issues: DetectedIssue[];
  warnings: DetectedIssue[];
  opportunities: DetectedIssue[];
  totalIssues: number;
  criticalIssues: number;
  companyId: string;
  generatedAt: Date;
}

/**
 * Genera un reporte completo de salud del sistema para una empresa
 */
export async function generateSystemHealthReport(companyId: string): Promise<SystemHealthReport> {
  const issues: DetectedIssue[] = [];
  const warnings: DetectedIssue[] = [];
  const opportunities: DetectedIssue[] = [];

  // Detectar contratos próximos a vencer (30 días)
  const expiringContracts = await detectExpiringContracts(companyId);
  issues.push(
    ...expiringContracts.filter((i) => i.severity === 'high' || i.severity === 'critical')
  );
  warnings.push(...expiringContracts.filter((i) => i.severity === 'medium'));

  // Detectar pagos vencidos
  const overduePayments = await detectOverduePayments(companyId);
  issues.push(...overduePayments);

  // Detectar mantenimientos pendientes
  const overdueMaintenances = await detectOverdueMaintenances(companyId);
  warnings.push(...overdueMaintenances);

  // Detectar baja ocupación
  const lowOccupancy = await detectLowOccupancy(companyId);
  if (lowOccupancy) {
    warnings.push(lowOccupancy);
  }

  // Detectar datos faltantes
  const missingData = await detectMissingData(companyId);
  opportunities.push(...missingData);

  // Detectar oportunidades de automatización
  const automationOpportunities = await detectAutomationOpportunities(companyId);
  opportunities.push(...automationOpportunities);

  const allIssues = [...issues, ...warnings, ...opportunities];
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  const highCount = allIssues.filter((i) => i.severity === 'high').length;
  const mediumCount = allIssues.filter((i) => i.severity === 'medium').length;

  // Calcular puntuación de salud (0-100)
  const healthScore = Math.max(0, 100 - criticalCount * 20 - highCount * 10 - mediumCount * 5);

  return {
    overallScore: healthScore,
    issues,
    warnings,
    opportunities,
    totalIssues: allIssues.length,
    criticalIssues: criticalCount,
    companyId,
    generatedAt: new Date(),
  };
}

/**
 * Detecta contratos que están por vencer
 */
async function detectExpiringContracts(companyId: string): Promise<DetectedIssue[]> {
  const today = new Date();
  const in30Days = addDays(today, 30);
  const in7Days = addDays(today, 7);

  const contracts = await prisma.contract.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: 'activo',
      fechaFin: {
        lte: in30Days,
        gte: today,
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

  return contracts.map((contract) => {
    const daysUntilExpiry = differenceInDays(contract.fechaFin, today);

    let severity: 'high' | 'critical' | 'medium';
    if (daysUntilExpiry <= 7) {
      severity = 'critical';
    } else if (daysUntilExpiry <= 14) {
      severity = 'high';
    } else {
      severity = 'medium';
    }

    return {
      id: `contract-expiring-${contract.id}`,
      type: 'contract_expiring',
      severity,
      title: `Contrato vence en ${daysUntilExpiry} días`,
      description: `El contrato de ${contract.tenant.nombreCompleto} en unidad ${contract.unit.numero} (${contract.unit.building.nombre}) vence el ${contract.fechaFin.toLocaleDateString('es-ES')}.`,
      affectedEntity: {
        type: 'contract',
        id: contract.id,
        name: `${contract.tenant.nombreCompleto} - Unidad ${contract.unit.numero}`,
      },
      suggestedAction: 'Contacta al inquilino para renovar el contrato o buscar nuevo inquilino.',
      actionUrl: `/contratos/${contract.id}`,
      detectedAt: new Date(),
    };
  });
}

/**
 * Detecta pagos vencidos
 */
async function detectOverduePayments(companyId: string): Promise<DetectedIssue[]> {
  const today = new Date();

  const overduePayments = await prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          building: {
            companyId,
          },
        },
      },
      estado: {
        in: ['pendiente'],
      },
      fechaVencimiento: {
        lt: today,
      },
    },
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
    orderBy: {
      fechaVencimiento: 'asc',
    },
  });

  return overduePayments.map((payment: any) => {
    const daysOverdue = differenceInDays(today, payment.fechaVencimiento);

    let severity: 'high' | 'critical' | 'medium';
    if (daysOverdue >= 30) {
      severity = 'critical';
    } else if (daysOverdue >= 15) {
      severity = 'high';
    } else {
      severity = 'medium';
    }

    return {
      id: `payment-overdue-${payment.id}`,
      type: 'payment_overdue' as const,
      severity,
      title: `Pago vencido hace ${daysOverdue} días`,
      description: `${payment.contract.tenant.nombreCompleto} tiene un pago pendiente de €${payment.monto} desde el ${payment.fechaVencimiento.toLocaleDateString('es-ES')}.`,
      affectedEntity: {
        type: 'payment',
        id: payment.id,
        name: `${payment.contract.tenant.nombreCompleto} - €${payment.monto}`,
      },
      suggestedAction: 'Envía un recordatorio automático o contacta al inquilino directamente.',
      actionUrl: `/pagos/${payment.id}`,
      detectedAt: new Date(),
    };
  });
}
/**
 * Detecta mantenimientos atrasados
 */
async function detectOverdueMaintenances(companyId: string): Promise<DetectedIssue[]> {
  // TODO: Implementar cuando el modelo Maintenance esté disponible
  return [];
}

/**
 * Detecta baja ocupación
 */
async function detectLowOccupancy(companyId: string): Promise<DetectedIssue | null> {
  const totalUnits = await prisma.unit.count({
    where: {
      building: {
        companyId,
      },
    },
  });

  const occupiedUnits = await prisma.contract.count({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: 'activo',
    },
  });

  if (totalUnits === 0) return null;

  const occupancyRate = (occupiedUnits / totalUnits) * 100;

  if (occupancyRate < 70) {
    const emptyUnits = totalUnits - occupiedUnits;

    return {
      id: 'low-occupancy',
      type: 'low_occupancy',
      severity: occupancyRate < 50 ? 'high' : 'medium',
      title: `Tasa de ocupación baja: ${occupancyRate.toFixed(1)}%`,
      description: `Tienes ${emptyUnits} unidades vacías. Considera estrategias de marketing o ajuste de precios.`,
      affectedEntity: {
        type: 'company',
        id: companyId,
        name: 'Portfolio general',
      },
      suggestedAction:
        'Publica en portales inmobiliarios o activa módulos STR para alquiler vacacional.',
      actionUrl: '/anuncios',
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detecta datos faltantes importantes
 */
async function detectMissingData(companyId: string): Promise<DetectedIssue[]> {
  const issues: DetectedIssue[] = [];

  // Edificios sin fotos - Simplificado
  const buildingsWithoutPhotos = 0; // TODO: Implementar cuando el modelo tenga el campo correcto

  if (buildingsWithoutPhotos > 0) {
    issues.push({
      id: 'missing-building-photos',
      type: 'missing_data' as const,
      severity: 'low',
      title: `${buildingsWithoutPhotos} edificios sin fotos`,
      description: 'Añade fotos para mejorar la presentación profesional de tus propiedades.',
      affectedEntity: {
        type: 'buildings',
        id: 'multiple',
        name: `${buildingsWithoutPhotos} edificios`,
      },
      suggestedAction: 'Sube fotos de calidad de tus edificios.',
      actionUrl: '/edificios',
      detectedAt: new Date(),
    });
  }

  // Inquilinos sin email
  const tenantsWithoutEmail = await prisma.tenant.count({
    where: {
      companyId,
      email: '',
    },
  });

  if (tenantsWithoutEmail > 0) {
    issues.push({
      id: 'missing-tenant-emails',
      type: 'missing_data' as const,
      severity: 'medium',
      title: `${tenantsWithoutEmail} inquilinos sin email`,
      description: 'Completa los emails para enviar notificaciones y recordatorios automáticos.',
      affectedEntity: {
        type: 'tenants',
        id: 'multiple',
        name: `${tenantsWithoutEmail} inquilinos`,
      },
      suggestedAction: 'Actualiza los datos de contacto de tus inquilinos.',
      actionUrl: '/inquilinos',
      detectedAt: new Date(),
    });
  }

  return issues;
}

/**
 * Detecta oportunidades de automatización
 */
async function detectAutomationOpportunities(companyId: string): Promise<DetectedIssue[]> {
  const opportunities: DetectedIssue[] = [];

  // Contratos sin pagos recurrentes configurados
  const contractsWithoutRecurring = await prisma.contract.count({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      estado: 'activo',
      stripeSubscription: null,
    },
  });

  if (contractsWithoutRecurring > 3) {
    opportunities.push({
      id: 'enable-recurring-payments',
      type: 'missing_data',
      severity: 'medium',
      title: `${contractsWithoutRecurring} contratos sin pagos automáticos`,
      description: 'Activa pagos recurrentes con Stripe para reducir morosidad hasta un 40%.',
      affectedEntity: {
        type: 'contracts',
        id: 'recurring-payments',
        name: `${contractsWithoutRecurring} contratos`,
      },
      suggestedAction: 'Configura pagos recurrentes en contratos activos.',
      actionUrl: '/contratos',
      detectedAt: new Date(),
    });
  }

  // Sin mantenimiento preventivo configurado
  const preventiveMaintenance = 0; // TODO: Implementar cuando el modelo MaintenanceSchedule esté disponible

  if (preventiveMaintenance === 0) {
    opportunities.push({
      id: 'setup-preventive-maintenance',
      type: 'missing_data' as const,
      severity: 'low',
      title: 'Sin mantenimiento preventivo',
      description: 'Programa revisiones automáticas de ascensores, calderas y otros equipos.',
      affectedEntity: {
        type: 'company',
        id: companyId,
        name: 'Sistema de mantenimiento',
      },
      suggestedAction: 'Configura programación de mantenimientos.',
      actionUrl: '/mantenimiento-preventivo',
      detectedAt: new Date(),
    });
  }

  return opportunities;
}

/**
 * Envía notificaciones automáticas sobre problemas detectados
 */
export async function sendProactiveNotifications(companyId: string): Promise<void> {
  const report = await generateSystemHealthReport(companyId);

  // Filtrar solo problemas críticos y altos
  const criticalIssues = [...report.issues].filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  );

  if (criticalIssues.length === 0) {
    return;
  }

  // Obtener usuarios de la empresa
  const users = await prisma.user.findMany({
    where: {
      companyId,
      activo: true,
      role: {
        in: ['super_admin', 'gestor'],
      },
    },
  });

  // Crear notificaciones
  for (const user of users) {
    for (const issue of criticalIssues) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          companyId,
          tipo: 'alerta_sistema',
          titulo: issue.title,
          mensaje: issue.description,
          leida: false,
        },
      });
    }
  }
}

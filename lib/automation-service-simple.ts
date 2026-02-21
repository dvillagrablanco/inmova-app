/**
 * SERVICIO DE AUTOMATIZACIONES CLAVE
 * Renovación de contratos, escalado de incidencias, recordatorios de pago.
 */

import logger from './logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export interface ContractRenewalConfig {
  advanceNoticeDays: number;
  autoRenew: boolean;
}

export interface IncidentEscalationConfig {
  urgentHours: number;
  highHours: number;
  mediumHours: number;
  notifyUsers: string[];
}

export interface PaymentReminderConfig {
  daysBefore: number[];
  daysAfter: number[];
  includeWhatsApp: boolean;
  includeEmail: boolean;
  includeSMS: boolean;
}

export class ContractRenewalService {
  async processUpcomingExpirations(companyId: string, config?: ContractRenewalConfig): Promise<{
    notified: number;
    renewed: number;
    errors: string[];
  }> {
    const prisma = await getPrisma();
    const advanceDays = config?.advanceNoticeDays ?? 60;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + advanceDays);

    try {
      const expiringContracts = await prisma.contract.findMany({
        where: {
          unit: { building: { companyId } },
          estado: 'activo',
          fechaFin: { lte: cutoff },
        },
        include: { tenant: true, unit: { include: { building: true } } },
      });

      let notified = 0;
      let renewed = 0;
      const errors: string[] = [];

      for (const contract of expiringContracts) {
        try {
          await prisma.notification.create({
            data: {
              companyId,
              tipo: 'alerta_sistema',
              titulo: 'Contrato próximo a vencer',
              mensaje: `El contrato de ${contract.tenant.nombreCompleto} en ${contract.unit.building.nombre} - ${contract.unit.numero} vence el ${contract.fechaFin?.toLocaleDateString('es-ES')}.`,
              entityId: contract.id,
              entityType: 'CONTRACT',
            },
          });
          notified++;

          if (config?.autoRenew && contract.renovacionAutomatica) {
            const newEnd = new Date(contract.fechaFin!);
            newEnd.setFullYear(newEnd.getFullYear() + 1);
            await prisma.contract.update({
              where: { id: contract.id },
              data: { fechaFin: newEnd },
            });
            renewed++;
          }
        } catch (e: any) {
          errors.push(`Contract ${contract.id}: ${e.message}`);
        }
      }

      logger.info(`[ContractRenewal] company=${companyId}: notified=${notified}, renewed=${renewed}`);
      return { notified, renewed, errors };
    } catch (error: any) {
      logger.error('[ContractRenewal] Error:', error);
      return { notified: 0, renewed: 0, errors: [error.message] };
    }
  }
}

export class IncidentEscalationService {
  async processEscalations(companyId: string, config?: IncidentEscalationConfig): Promise<{
    escalated: number;
    errors: string[];
  }> {
    const prisma = await getPrisma();
    const urgentHours = config?.urgentHours ?? 4;
    const highHours = config?.highHours ?? 24;

    try {
      const now = new Date();
      const urgentCutoff = new Date(now.getTime() - urgentHours * 60 * 60 * 1000);
      const highCutoff = new Date(now.getTime() - highHours * 60 * 60 * 1000);

      const pendingIncidents = await prisma.maintenanceRequest.findMany({
        where: {
          unit: { building: { companyId } },
          estado: { in: ['pendiente', 'en_progreso'] },
          createdAt: { lte: highCutoff },
        },
      });

      let escalated = 0;
      const errors: string[] = [];

      for (const incident of pendingIncidents) {
        try {
          const isUrgent = incident.createdAt <= urgentCutoff;
          await prisma.notification.create({
            data: {
              companyId,
              tipo: 'alerta_sistema',
              titulo: isUrgent ? 'Incidencia URGENTE sin resolver' : 'Incidencia pendiente de escalado',
              mensaje: `Incidencia #${incident.id} lleva ${Math.round((now.getTime() - incident.createdAt.getTime()) / 3600000)}h sin resolver.`,
              entityId: incident.id,
              entityType: 'MAINTENANCE',
            },
          });
          escalated++;
        } catch (e: any) {
          errors.push(`Incident ${incident.id}: ${e.message}`);
        }
      }

      logger.info(`[IncidentEscalation] company=${companyId}: escalated=${escalated}`);
      return { escalated, errors };
    } catch (error: any) {
      logger.error('[IncidentEscalation] Error:', error);
      return { escalated: 0, errors: [error.message] };
    }
  }
}

export class PaymentReminderService {
  async processReminders(companyId: string, config?: PaymentReminderConfig): Promise<{
    sent: number;
    errors: string[];
  }> {
    const prisma = await getPrisma();
    const daysBefore = config?.daysBefore ?? [3, 1];

    try {
      const now = new Date();
      let sent = 0;
      const errors: string[] = [];

      for (const days of daysBefore) {
        const target = new Date(now);
        target.setDate(target.getDate() + days);
        const startOfDay = new Date(target.setHours(0, 0, 0, 0));
        const endOfDay = new Date(target.setHours(23, 59, 59, 999));

        const upcomingPayments = await prisma.payment.findMany({
          where: {
            contract: { unit: { building: { companyId } } },
            estado: 'pendiente',
            fechaVencimiento: { gte: startOfDay, lte: endOfDay },
          },
          include: { contract: { include: { tenant: true } } },
        });

        for (const payment of upcomingPayments) {
          try {
            await prisma.notification.create({
              data: {
                companyId,
                tipo: 'pago_proximo',
                titulo: `Pago pendiente en ${days} día(s)`,
                mensaje: `${payment.contract.tenant.nombreCompleto} tiene un pago de €${payment.monto} con vencimiento el ${payment.fechaVencimiento.toLocaleDateString('es-ES')}.`,
                entityId: payment.id,
                entityType: 'PAYMENT',
              },
            });
            sent++;
          } catch (e: any) {
            errors.push(`Payment ${payment.id}: ${e.message}`);
          }
        }
      }

      logger.info(`[PaymentReminder] company=${companyId}: sent=${sent}`);
      return { sent, errors };
    } catch (error: any) {
      logger.error('[PaymentReminder] Error:', error);
      return { sent: 0, errors: [error.message] };
    }
  }
}

export const contractRenewalService = new ContractRenewalService();
export const incidentEscalationService = new IncidentEscalationService();
export const paymentReminderService = new PaymentReminderService();

/**
 * SERVICIO DE AUTOMATIZACIONES CLAVE - STUB VERSION
 * Este archivo contiene stubs de las funcionalidades automáticas.
 * Las implementaciones reales requieren configuración adicional del schema.
 */

import logger from './logger';

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
  async processUpcomingExpirations(
    _companyId: string,
    _config?: ContractRenewalConfig
  ): Promise<{
    notified: number;
    renewed: number;
    errors: string[];
  }> {
    logger.info('ContractRenewalService: Stub implementation');
    return {
      notified: 0,
      renewed: 0,
      errors: [],
    };
  }
}

export class IncidentEscalationService {
  async processEscalations(
    _companyId: string,
    _config?: IncidentEscalationConfig
  ): Promise<{
    escalated: number;
    errors: string[];
  }> {
    logger.info('IncidentEscalationService: Stub implementation');
    return {
      escalated: 0,
      errors: [],
    };
  }
}

export class PaymentReminderService {
  async processReminders(
    _companyId: string,
    _config?: PaymentReminderConfig
  ): Promise<{
    sent: number;
    errors: string[];
  }> {
    logger.info('PaymentReminderService: Stub implementation');
    return {
      sent: 0,
      errors: [],
    };
  }
}

export const contractRenewalService = new ContractRenewalService();
export const incidentEscalationService = new IncidentEscalationService();
export const paymentReminderService = new PaymentReminderService();

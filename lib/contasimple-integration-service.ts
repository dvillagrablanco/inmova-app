/**
 * Contasimple Integration Service - Stub
 * 
 * Modulo original eliminado en cleanup (Feb 2026) por tener 0 imports directos.
 * Restaurado como stub porque inmova-contasimple-bridge.ts lo importa transitivamente.
 * 
 * TODO: Reimplementar cuando la integracion Contasimple este activa.
 */

import logger from './logger';

export interface ContaSimpleCustomer {
  id?: string;
  name: string;
  email: string;
  taxId?: string;
  address?: string;
}

export interface ContaSimpleInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface ContaSimpleInvoice {
  id?: string;
  customerId: string;
  items: ContaSimpleInvoiceItem[];
  date: Date;
  dueDate?: Date;
  notes?: string;
}

export interface ContaSimplePayment {
  invoiceId: string;
  amount: number;
  date: Date;
  method?: string;
}

export class ContaSimpleIntegrationService {
  constructor() {
    logger.warn('[ContaSimple] Integration service is a stub - not connected');
  }

  async createCustomer(_data: ContaSimpleCustomer): Promise<ContaSimpleCustomer | null> {
    logger.warn('[ContaSimple] createCustomer called on stub');
    return null;
  }

  async createInvoice(_data: ContaSimpleInvoice): Promise<ContaSimpleInvoice | null> {
    logger.warn('[ContaSimple] createInvoice called on stub');
    return null;
  }

  async registerPayment(_data: ContaSimplePayment): Promise<boolean> {
    logger.warn('[ContaSimple] registerPayment called on stub');
    return false;
  }

  async getInvoice(_id: string): Promise<ContaSimpleInvoice | null> {
    return null;
  }

  async isConfigured(): Promise<boolean> {
    return false;
  }
}

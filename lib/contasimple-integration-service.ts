/**
 * Contasimple Integration Service
 *
 * Conecta con la API REST de Contasimple para:
 * - Crear/gestionar clientes
 * - Emitir facturas
 * - Registrar pagos
 * - Enviar facturas por email
 *
 * Docs: https://api.contasimple.com
 */

import logger from './logger';

const CONTASIMPLE_API_URL =
  process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/api/v2';
const CONTASIMPLE_AUTH_KEY =
  process.env.INMOVA_CONTASIMPLE_AUTH_KEY || process.env.CONTASIMPLE_AUTH_KEY || '';

export interface ContaSimpleCustomer {
  id?: string;
  name: string;
  taxId?: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    province?: string;
    country?: string;
  };
  customerType?: 'business' | 'individual';
}

export interface ContaSimpleInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate?: number;
  taxRate?: number;
  amount?: number;
}

export interface ContaSimpleInvoice {
  id?: string;
  number?: string;
  series?: string;
  customerId: string;
  items: ContaSimpleInvoiceItem[];
  date: Date;
  dueDate?: Date;
  subtotal?: number;
  taxBase?: number;
  iva?: number;
  total?: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'transfer' | 'card' | 'cash' | 'direct_debit';
  notes?: string;
}

export interface ContaSimplePayment {
  id?: string;
  invoiceId: string;
  amount: number;
  date: Date;
  method?: 'card' | 'transfer' | 'cash' | 'direct_debit' | string;
  reference?: string;
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const url = `${CONTASIMPLE_API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${CONTASIMPLE_AUTH_KEY}`,
  };

  const options: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Contasimple API ${method} ${endpoint} failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  return data as T;
}

export class ContaSimpleIntegrationService {
  constructor() {
    if (!CONTASIMPLE_AUTH_KEY) {
      logger.warn('[ContaSimple] No auth key configured - API calls will fail');
    }
  }

  isConfigured(): boolean {
    return !!CONTASIMPLE_AUTH_KEY;
  }

  async createCustomer(
    data: ContaSimpleCustomer
  ): Promise<ContaSimpleCustomer> {
    if (!this.isConfigured()) {
      logger.warn('[ContaSimple] createCustomer skipped - not configured');
      return { ...data, id: `local_${Date.now()}` };
    }

    try {
      const payload = {
        name: data.name,
        tax_id: data.taxId || '',
        email: data.email,
        phone: data.phone || '',
        address: data.address?.street || '',
        city: data.address?.city || '',
        postal_code: data.address?.postalCode || '',
        province: data.address?.province || '',
        country_code: data.address?.country === 'España' ? 'ES' : (data.address?.country || 'ES'),
        customer_type: data.customerType === 'individual' ? 'P' : 'E',
      };

      const result = await apiRequest<{ data: { id: string; name: string } }>(
        'POST',
        '/customers',
        payload
      );

      logger.info(`[ContaSimple] Customer created: ${result.data.id}`);
      return { ...data, id: String(result.data.id) };
    } catch (error) {
      logger.error('[ContaSimple] Error creating customer:', error);
      throw error;
    }
  }

  async createInvoice(data: ContaSimpleInvoice): Promise<ContaSimpleInvoice> {
    if (!this.isConfigured()) {
      logger.warn('[ContaSimple] createInvoice skipped - not configured');
      return { ...data, id: `local_inv_${Date.now()}` };
    }

    try {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.ivaRate ?? item.taxRate ?? 21,
      }));

      const payload = {
        customer_id: data.customerId,
        number: data.number,
        series: data.series || 'INV',
        date: data.date.toISOString().split('T')[0],
        due_date: data.dueDate
          ? data.dueDate.toISOString().split('T')[0]
          : undefined,
        items,
        notes: data.notes || '',
        payment_method: data.paymentMethod || 'card',
        status: data.status || 'sent',
      };

      const result = await apiRequest<{
        data: { id: string; number: string; total: number };
      }>('POST', '/invoices/issued', payload);

      logger.info(
        `[ContaSimple] Invoice created: ${result.data.id} (${result.data.number})`
      );
      return { ...data, id: String(result.data.id) };
    } catch (error) {
      logger.error('[ContaSimple] Error creating invoice:', error);
      throw error;
    }
  }

  async registerPayment(
    data: ContaSimplePayment
  ): Promise<ContaSimplePayment> {
    if (!this.isConfigured()) {
      logger.warn('[ContaSimple] registerPayment skipped - not configured');
      return { ...data, id: `local_pay_${Date.now()}` };
    }

    try {
      const payload = {
        amount: data.amount,
        date: data.date.toISOString().split('T')[0],
        payment_method: data.method || 'card',
        reference: data.reference || '',
      };

      const result = await apiRequest<{ data: { id: string } }>(
        'POST',
        `/invoices/issued/${data.invoiceId}/payments`,
        payload
      );

      logger.info(
        `[ContaSimple] Payment registered: ${result.data.id} for invoice ${data.invoiceId}`
      );
      return { ...data, id: String(result.data.id) };
    } catch (error) {
      logger.error('[ContaSimple] Error registering payment:', error);
      throw error;
    }
  }

  async sendInvoice(invoiceId: string, email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[ContaSimple] sendInvoice skipped - not configured');
      return false;
    }

    try {
      await apiRequest('POST', `/invoices/issued/${invoiceId}/send`, {
        email,
      });
      logger.info(
        `[ContaSimple] Invoice ${invoiceId} sent to ${email}`
      );
      return true;
    } catch (error) {
      logger.error('[ContaSimple] Error sending invoice:', error);
      return false;
    }
  }

  async getInvoicePdf(invoiceId: string): Promise<Buffer | null> {
    if (!this.isConfigured()) return null;

    try {
      const url = `${CONTASIMPLE_API_URL}/invoices/issued/${invoiceId}/pdf`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${CONTASIMPLE_AUTH_KEY}`,
          Accept: 'application/pdf',
        },
      });

      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('[ContaSimple] Error getting invoice PDF:', error);
      return null;
    }
  }

  async getInvoice(id: string): Promise<ContaSimpleInvoice | null> {
    if (!this.isConfigured()) return null;

    try {
      const result = await apiRequest<{ data: any }>('GET', `/invoices/issued/${id}`);
      return result.data;
    } catch (error) {
      logger.error('[ContaSimple] Error getting invoice:', error);
      return null;
    }
  }
}

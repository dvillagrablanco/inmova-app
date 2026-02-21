// @ts-nocheck
/**
 * Holded Integration Service
 * 
 * Servicio de integración con Holded
 * Sistema de gestión empresarial todo-en-uno (ERP, CRM, Contabilidad, Proyectos)
 * Popular en España y Latinoamérica
 * 
 * Características:
 * - Gestión de contactos
 * - Emisión de facturas
 * - Registro de pagos
 * - Gestión de gastos
 * 
 * Documentación API: https://developers.holded.com/reference
 */

import axios, { AxiosInstance } from 'axios';
// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface HoldedConfig {
  apiKey: string;
  apiUrl: string;
}

interface HoldedContact {
  id?: string;
  name: string;
  code?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  vatNumber?: string;
  type?: 'client' | 'supplier' | 'both';
}

interface HoldedInvoice {
  id?: string;
  contactId: string;
  contactName?: string;
  date: string;
  dueDate: string;
  currency: string;
  items: Array<{
    name: string;
    desc?: string;
    units: number;
    subtotal: number;
    tax?: number;
  }>;
  notes?: string;
}

interface HoldedPayment {
  id?: string;
  date: string;
  contactId: string;
  documentsId: string[];  // IDs de facturas
  amount: number;
  paymentMethod?: string;
  account?: string;
  notes?: string;
}

interface HoldedExpense {
  id?: string;
  date: string;
  contactId?: string;
  category: string;
  desc: string;
  subtotal: number;
  tax?: number;
  paymentMethod?: string;
  account?: string;
}

class HoldedIntegrationService {
  private config: HoldedConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      apiKey: process.env.HOLDED_API_KEY || '',
      apiUrl: 'https://api.holded.com/api'
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'key': this.config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Verifica si Holded está configurado
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Crea un contacto en Holded
   */
  async createContact(contact: HoldedContact): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.post('/contacts', {
      name: contact.name,
      code: contact.code,
      email: contact.email,
      mobile: contact.mobile,
      phone: contact.phone,
      billAddress: contact.address,
      billCity: contact.city,
      billPostalcode: contact.postalCode,
      billProvince: contact.province,
      billCountry: contact.country || 'ES',
      vatnumber: contact.vatNumber,
      type: contact.type || 'client'
    });

    return response.data;
  }

  /**
   * Obtiene un contacto por ID
   */
  async getContact(contactId: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.get(`/contacts/${contactId}`);
    return response.data;
  }

  /**
   * Busca un contacto por email
   */
  async findContactByEmail(email: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.get('/contacts', {
      params: { email }
    });

    return response.data?.[0] || null;
  }

  /**
   * Actualiza un contacto
   */
  async updateContact(contactId: string, contact: Partial<HoldedContact>): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.put(`/contacts/${contactId}`, contact);
    return response.data;
  }

  /**
   * Crea una factura en Holded
   */
  async createInvoice(invoice: HoldedInvoice): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.post('/invoicing/v1/documents/invoice', {
      contactId: invoice.contactId,
      contactName: invoice.contactName,
      date: new Date(invoice.date).getTime() / 1000,  // Unix timestamp
      dueDate: new Date(invoice.dueDate).getTime() / 1000,
      currency: invoice.currency || 'EUR',
      items: invoice.items,
      notes: invoice.notes
    });

    return response.data;
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.get(`/invoicing/v1/documents/invoice/${invoiceId}`);
    return response.data;
  }

  /**
   * Registra un pago en Holded
   */
  async registerPayment(payment: HoldedPayment): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.post('/invoicing/v1/documents/payment', {
      date: new Date(payment.date).getTime() / 1000,
      contactId: payment.contactId,
      documentsId: payment.documentsId,
      amount: payment.amount,
      paymethod: payment.paymentMethod || 'bank',
      account: payment.account,
      notes: payment.notes
    });

    return response.data;
  }

  /**
   * Crea un gasto en Holded
   */
  async createExpense(expense: HoldedExpense): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Holded API key not configured');
    }

    const response = await this.client.post('/expenses', {
      date: new Date(expense.date).getTime() / 1000,
      contactId: expense.contactId,
      category: expense.category,
      desc: expense.desc,
      subtotal: expense.subtotal,
      tax: expense.tax || 0,
      paymethod: expense.paymentMethod || 'bank',
      account: expense.account
    });

    return response.data;
  }

  /**
   * Sincroniza un inquilino de INMOVA como contacto en Holded
   */
  async syncTenantToContact(tenantId: string, companyId: string): Promise<any> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: { include: { building: true } } }
    });

    if (!tenant || tenant.companyId !== companyId) {
      throw new Error('Tenant not found or access denied');
    }

    // Buscar contacto existente
    const existingContact = await this.findContactByEmail(tenant.email);

    if (existingContact) {
      return existingContact;
    }

    // Crear nuevo contacto
    const firstUnit = tenant.units?.[0];
    const contact: HoldedContact = {
      name: tenant.nombreCompleto,
      code: tenantId.substring(0, 10),
      email: tenant.email,
      mobile: tenant.telefono,
      phone: tenant.telefono,
      address: firstUnit?.building?.direccion || '',
      city: firstUnit?.building?.ciudad,
      postalCode: firstUnit?.building?.codigoPostal,
      country: firstUnit?.building?.pais || 'ES',
      vatNumber: tenant.dni,
      type: 'client'
    };

    return await this.createContact(contact);
  }

  /**
   * Crea una factura en Holded desde un contrato de INMOVA
   */
  async createInvoiceFromContract(contractId: string, companyId: string): Promise<any> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        unit: { include: { building: true } }
      }
    });

    if (!contract || contract.tenant.companyId !== companyId) {
      throw new Error('Contract not found or access denied');
    }

    // Sincronizar inquilino como contacto
    const contact = await this.syncTenantToContact(contract.tenantId, companyId);

    // Crear factura
    const invoice: HoldedInvoice = {
      contactId: contact.id,
      contactName: contact.name,
      date: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(contract.diaPago || 5)).toISOString(),
      currency: 'EUR',
      items: [
        {
          name: `Renta mensual - ${contract.unit?.numero}`,
          desc: `Alquiler de ${contract.unit?.numero} en ${contract.unit?.building?.nombre}`,
          units: 1,
          subtotal: contract.rentaMensual,
          tax: 21  // IVA estándar en España
        }
      ],
      notes: `Contrato ID: ${contractId}`
    };

    if (contract.deposito) {
      invoice.items.push({
        name: 'Depósito de garantía',
        desc: 'Depósito reembolsable al finalizar el contrato',
        units: 1,
        subtotal: contract.deposito,
        tax: 0  // El depósito no lleva IVA
      });
    }

    return await this.createInvoice(invoice);
  }

  /**
   * Registra un pago de INMOVA en Holded
   */
  async syncPaymentToHolded(paymentId: string, companyId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: { include: { building: true } }
          }
        }
      }
    });

    if (!payment || payment.contract.tenant.companyId !== companyId) {
      throw new Error('Payment not found or access denied');
    }

    // Buscar o crear contacto
    const contact = await this.syncTenantToContact(payment.contract.tenantId, companyId);

    const holdedPayment: HoldedPayment = {
      date: payment.fechaPago?.toISOString() || new Date().toISOString(),
      contactId: contact.id,
      documentsId: payment.holdedInvoiceId ? [payment.holdedInvoiceId] : [],  // Necesitas almacenar esto
      amount: payment.monto,
      paymentMethod: payment.metodoPago || 'bank',
      notes: `Pago INMOVA - Ref: ${payment.concepto}`
    };

    return await this.registerPayment(holdedPayment);
  }

  /**
   * Sincroniza un gasto de INMOVA en Holded
   */
  async syncExpenseToHolded(expenseId: string, companyId: string): Promise<any> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        building: true,
        provider: true
      }
    });

    if (!expense || expense.companyId !== companyId) {
      throw new Error('Expense not found or access denied');
    }

    // Si hay proveedor, sincronizarlo como contacto tipo 'supplier'
    let contactId: string | undefined;
    if (expense.provider) {
      const providerContact = await this.findContactByEmail(expense.provider.email);
      if (!providerContact) {
        const newContact = await this.createContact({
          name: expense.provider.nombre,
          email: expense.provider.email,
          phone: expense.provider.telefono,
          type: 'supplier'
        });
        contactId = newContact.id;
      } else {
        contactId = providerContact.id;
      }
    }

    const holdedExpense: HoldedExpense = {
      date: expense.fecha.toISOString(),
      contactId,
      category: expense.categoria,
      desc: expense.descripcion,
      subtotal: expense.monto,
      tax: 21,  // IVA estándar
      paymentMethod: 'bank'
    };

    return await this.createExpense(holdedExpense);
  }

  /**
   * Prueba la conexión con Holded
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          message: 'API Key no configurada. Por favor, añade HOLDED_API_KEY a las variables de entorno.'
        };
      }

      // Intentar obtener información de la cuenta
      const response = await this.client.get('/company/info');

      return {
        success: true,
        message: `Conectado exitosamente a Holded (${response.data.name || 'Cuenta activa'})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.response?.data?.message || error.message}`
      };
    }
  }
}

// Singleton instance
let holdedService: HoldedIntegrationService | null = null;

export function getHoldedService(): HoldedIntegrationService {
  if (!holdedService) {
    holdedService = new HoldedIntegrationService();
  }
  return holdedService;
}

export function isHoldedConfigured(): boolean {
  return getHoldedService().isConfigured();
}

export { HoldedIntegrationService };
export type { HoldedContact, HoldedInvoice, HoldedPayment, HoldedExpense };

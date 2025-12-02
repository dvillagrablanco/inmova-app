/**
 * Alegra Integration Service
 * 
 * Servicio de integración con Alegra
 * Software de contabilidad y facturación en la nube
 * Líder en Colombia y Latinoamérica
 * 
 * Características:
 * - Gestión de contactos
 * - Facturación electrónica
 * - Registro de pagos
 * - Compras y gastos
 * 
 * Documentación API: https://developer.alegra.com/docs/
 */

import axios, { AxiosInstance } from 'axios';
import { prisma } from './db';

interface AlegraConfig {
  username: string;  // API username (email)
  apiToken: string;
  apiUrl: string;
}

interface AlegraContact {
  id?: string;
  name: string;
  idNumber: string;  // Número de identificación
  phonePrimary?: string;
  email?: string;
  address?: {
    address: string;
    city?: string;
    department?: string;  // Estado/Provincia
  };
  type?: 'client' | 'provider';
}

interface AlegraInvoice {
  id?: string;
  date: string;
  dueDate: string;
  client: number;  // ID del cliente
  currency: string;
  items: Array<{
    name: string;
    description?: string;
    price: number;
    quantity: number;
    tax?: Array<{
      id: number;
      percentage: number;
    }>;
  }>;
  observations?: string;
  stamp?: {
    generateStamp: boolean;  // Generar factura electrónica
  };
}

interface AlegraPayment {
  id?: string;
  date: string;
  bankAccount?: number;
  invoices: Array<{
    id: number;
    amount: number;
  }>;
  paymentMethod?: string;
  observations?: string;
}

interface AlegraExpense {
  id?: string;
  date: string;
  contact?: number;  // ID del proveedor
  category?: number;  // ID de la categoría
  description: string;
  price: number;
  tax?: Array<{
    id: number;
    percentage: number;
  }>;
  paymentMethod?: string;
  bankAccount?: number;
}

class AlegraIntegrationService {
  private config: AlegraConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      username: process.env.ALEGRA_USERNAME || '',
      apiToken: process.env.ALEGRA_API_TOKEN || '',
      apiUrl: 'https://api.alegra.com/api/v1'
    };

    // Alegra usa Basic Auth
    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Verifica si Alegra está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.username && this.config.apiToken);
  }

  /**
   * Crea un contacto en Alegra
   */
  async createContact(contact: AlegraContact): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.post('/contacts', {
      name: contact.name,
      identification: contact.idNumber,
      phonePrimary: contact.phonePrimary,
      email: contact.email,
      address: contact.address,
      type: [contact.type || 'client']
    });

    return response.data;
  }

  /**
   * Obtiene un contacto por ID
   */
  async getContact(contactId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.get(`/contacts/${contactId}`);
    return response.data;
  }

  /**
   * Busca un contacto por número de identificación
   */
  async findContactByIdNumber(idNumber: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.get('/contacts', {
      params: { identification: idNumber }
    });

    return response.data?.[0] || null;
  }

  /**
   * Actualiza un contacto
   */
  async updateContact(contactId: string, contact: Partial<AlegraContact>): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.put(`/contacts/${contactId}`, contact);
    return response.data;
  }

  /**
   * Crea una factura en Alegra
   */
  async createInvoice(invoice: AlegraInvoice): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.post('/invoices', {
      date: invoice.date,
      dueDate: invoice.dueDate,
      client: invoice.client,
      currency: invoice.currency || 'COP',  // Peso colombiano por defecto
      items: invoice.items,
      observations: invoice.observations,
      stamp: invoice.stamp || { generateStamp: false }
    });

    return response.data;
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Registra un pago en Alegra
   */
  async registerPayment(payment: AlegraPayment): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.post('/payments', {
      date: payment.date,
      bankAccount: payment.bankAccount,
      invoices: payment.invoices,
      paymentMethod: payment.paymentMethod || 'cash',
      observations: payment.observations
    });

    return response.data;
  }

  /**
   * Crea un gasto/compra en Alegra
   */
  async createExpense(expense: AlegraExpense): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Alegra not configured');
    }

    const response = await this.client.post('/bills', {
      date: expense.date,
      contact: expense.contact,
      category: expense.category,
      items: [{
        name: expense.description,
        price: expense.price,
        quantity: 1,
        tax: expense.tax
      }],
      paymentMethod: expense.paymentMethod,
      bankAccount: expense.bankAccount
    });

    return response.data;
  }

  /**
   * Sincroniza un inquilino de INMOVA como contacto en Alegra
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
    const existingContact = await this.findContactByIdNumber(tenant.dni);

    if (existingContact) {
      return existingContact;
    }

    // Crear nuevo contacto
    const firstUnit = tenant.units?.[0];
    const contact: AlegraContact = {
      name: tenant.nombreCompleto,
      idNumber: tenant.dni,
      phonePrimary: tenant.telefono,
      email: tenant.email,
      address: {
        address: firstUnit?.building?.direccion || '',
        city: firstUnit?.building?.ciudad,
        department: firstUnit?.building?.provincia
      },
      type: 'client'
    };

    return await this.createContact(contact);
  }

  /**
   * Crea una factura en Alegra desde un contrato de INMOVA
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
    const invoice: AlegraInvoice = {
      date: new Date().toISOString().split('T')[0],
      dueDate: contract.fechaVencimiento.toISOString().split('T')[0],
      client: parseInt(contact.id),
      currency: 'COP',  // Configurable según el país
      items: [
        {
          name: `Renta mensual - ${contract.unit?.nombre}`,
          description: `Alquiler de ${contract.unit?.nombre} en ${contract.unit?.building?.nombre}`,
          price: contract.rentaMensual,
          quantity: 1,
          tax: [{ id: 1, percentage: 0 }]  // Sin IVA para alquileres residenciales
        }
      ],
      observations: `Contrato ID: ${contractId}\nPeríodo: ${contract.fechaInicio.toLocaleDateString('es-ES')} - ${contract.fechaFin.toLocaleDateString('es-ES')}`,
      stamp: {
        generateStamp: false  // Cambiar a true para facturación electrónica
      }
    };

    if (contract.deposito) {
      invoice.items.push({
        name: 'Depósito de garantía',
        description: 'Depósito reembolsable al finalizar el contrato',
        price: contract.deposito,
        quantity: 1,
        tax: [{ id: 1, percentage: 0 }]
      });
    }

    return await this.createInvoice(invoice);
  }

  /**
   * Registra un pago de INMOVA en Alegra
   */
  async syncPaymentToAlegra(paymentId: string, companyId: string): Promise<any> {
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

    const alegraPayment: AlegraPayment = {
      date: payment.fechaPago?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      invoices: payment.alegraInvoiceId ? [{
        id: parseInt(payment.alegraInvoiceId),
        amount: payment.monto
      }] : [],
      paymentMethod: this.mapPaymentMethod(payment.metodoPago),
      observations: `Pago INMOVA - Ref: ${payment.concepto}`
    };

    return await this.registerPayment(alegraPayment);
  }

  /**
   * Sincroniza un gasto de INMOVA en Alegra
   */
  async syncExpenseToAlegra(expenseId: string, companyId: string): Promise<any> {
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

    // Si hay proveedor, sincronizarlo como contacto tipo 'provider'
    let contactId: number | undefined;
    if (expense.provider) {
      const providerContact = await this.findContactByIdNumber(expense.provider.cif || expense.provider.id);
      if (!providerContact) {
        const newContact = await this.createContact({
          name: expense.provider.nombre,
          idNumber: expense.provider.cif || expense.provider.id,
          phonePrimary: expense.provider.telefono,
          email: expense.provider.email,
          type: 'provider'
        });
        contactId = parseInt(newContact.id);
      } else {
        contactId = parseInt(providerContact.id);
      }
    }

    const alegraExpense: AlegraExpense = {
      date: expense.fecha.toISOString().split('T')[0],
      contact: contactId,
      description: expense.descripcion,
      price: expense.monto,
      tax: [{ id: 1, percentage: 19 }],  // IVA colombiano estándar (ajustar según país)
      paymentMethod: 'cash'
    };

    return await this.createExpense(alegraExpense);
  }

  /**
   * Mapea métodos de pago de INMOVA a Alegra
   */
  private mapPaymentMethod(method: string | null): string {
    const mapping: { [key: string]: string } = {
      'transferencia': 'bank-transfer',
      'tarjeta': 'credit-card',
      'efectivo': 'cash',
      'domiciliacion': 'debit'
    };

    return mapping[method?.toLowerCase() || 'efectivo'] || 'cash';
  }

  /**
   * Prueba la conexión con Alegra
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Alegra no configurado. Por favor, añade ALEGRA_USERNAME y ALEGRA_API_TOKEN en las variables de entorno.'
        };
      }

      // Intentar obtener información de la compañía
      const response = await this.client.get('/company');

      return {
        success: true,
        message: `Conectado exitosamente a Alegra (${response.data.name || 'Cuenta activa'})`
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
let alegraService: AlegraIntegrationService | null = null;

export function getAlegraService(): AlegraIntegrationService {
  if (!alegraService) {
    alegraService = new AlegraIntegrationService();
  }
  return alegraService;
}

export function isAlegraConfigured(): boolean {
  return getAlegraService().isConfigured();
}

export { AlegraIntegrationService };
export type { AlegraContact, AlegraInvoice, AlegraPayment, AlegraExpense };

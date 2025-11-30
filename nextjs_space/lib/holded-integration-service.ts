/**
 * HOLDED INTEGRATION SERVICE (PREPARADO - NO FUNCIONAL)
 * 
 * Servicio de integración con Holded
 * Software de gestión empresarial todo-en-uno, muy popular en startups y pymes tech
 * 
 * ==============================================================================
 * IMPORTANTE: Este código está preparado en modo DEMO
 * Requiere credenciales reales de Holded para funcionar
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - Web oficial: https://www.holded.com
 * - API Docs: https://developers.holded.com
 * - API Reference: https://api.holded.com/docs
 * 
 * CÓMO ACTIVAR ESTA INTEGRACIÓN:
 * 
 * 1. Obtener Credenciales:
 *    - Acceder a https://www.holded.com
 *    - Ir a Configuración > Integraciones > API
 *    - Generar API Key
 * 
 * 2. Configurar Variables de Entorno (.env):
 *    HOLDED_API_KEY=tu_api_key
 *    HOLDED_API_URL=https://api.holded.com/api
 * 
 * 3. Descomentar el código de este archivo
 * 
 * 4. Instalar dependencias adicionales (si no están instaladas):
 *    yarn add axios
 */

// import axios, { AxiosInstance } from 'axios';

export interface HoldedConfig {
  apiKey: string;
  apiUrl: string;
}

export interface HoldedContact {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  vatNumber?: string; // CIF/NIF
  type: 'client' | 'provider';
  address?: {
    street: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };
}

export interface HoldedInvoice {
  id: string;
  docNumber: string;
  contactId: string;
  contactName: string;
  date: Date;
  dueDate?: Date;
  items: HoldedInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'pending' | 'overdue';
  notes?: string;
}

export interface HoldedInvoiceItem {
  name: string;
  desc?: string;
  units: number;
  price: number;
  tax: number; // Porcentaje de IVA
  subtotal: number;
  total: number;
}

export interface HoldedPayment {
  id: string;
  documentId: string;
  date: Date;
  amount: number;
  account: string;
  notes?: string;
}

export interface HoldedExpense {
  id: string;
  contactId?: string;
  date: Date;
  category: string;
  desc: string;
  amount: number;
  tax: number;
  attachments?: string[];
}

export class HoldedIntegrationService {
  // private config: HoldedConfig;
  // private axiosInstance: AxiosInstance;

  constructor() {
    // this.config = {
    //   apiKey: process.env.HOLDED_API_KEY || '',
    //   apiUrl: process.env.HOLDED_API_URL || 'https://api.holded.com/api',
    // };

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //     'Key': this.config.apiKey,
    //   },
    // });

    console.log('⚠️ Holded Integration Service: Modo DEMO - Requiere credenciales reales');
  }

  /**
   * GESTIÓN DE CONTACTOS
   */

  // async createContact(contact: Omit<HoldedContact, 'id'>): Promise<HoldedContact> {
  //   const response = await this.axiosInstance.post('/contacts', contact);
  //   return response.data;
  // }

  // async getContact(contactId: string): Promise<HoldedContact> {
  //   const response = await this.axiosInstance.get(`/contacts/${contactId}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(invoice: Omit<HoldedInvoice, 'id'>): Promise<HoldedInvoice> {
  //   const response = await this.axiosInstance.post('/invoicing/v1/documents/invoice', invoice);
  //   return response.data;
  // }

  // async getInvoice(invoiceId: string): Promise<HoldedInvoice> {
  //   const response = await this.axiosInstance.get(`/invoicing/v1/documents/invoice/${invoiceId}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE PAGOS
   */

  // async registerPayment(payment: Omit<HoldedPayment, 'id'>): Promise<HoldedPayment> {
  //   const response = await this.axiosInstance.post('/invoicing/v1/documents/invoice/payment', payment);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE GASTOS
   */

  // async createExpense(expense: Omit<HoldedExpense, 'id'>): Promise<HoldedExpense> {
  //   const response = await this.axiosInstance.post('/invoicing/v1/documents/expense', expense);
  //   return response.data;
  // }

  /**
   * MÉTODOS DEMO
   */

  async syncTenantToContactDemo(tenant: any): Promise<any> {
    console.log('🔄 [DEMO] Sincronizando inquilino con Holded:', tenant.nombreCompleto);
    return {
      id: `holded_contact_${Math.random().toString(36).substring(7)}`,
      name: tenant.nombreCompleto,
      vatNumber: tenant.dni,
      email: tenant.email,
      type: 'client',
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    console.log('📄 [DEMO] Creando factura en Holded para contrato:', contractData.id);
    const docNumber = `HLD${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    return {
      id: `holded_invoice_${Math.random().toString(36).substring(7)}`,
      docNumber,
      subtotal: contractData.rentaMensual,
      tax: contractData.rentaMensual * 0.21,
      total: contractData.rentaMensual * 1.21,
      status: 'draft',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    console.log('💰 [DEMO] Registrando pago en Holded:', payment.monto);
    return {
      id: `holded_payment_${Math.random().toString(36).substring(7)}`,
      amount: payment.monto,
      registered: true,
      registeredAt: new Date(),
    };
  }

  async createExpenseDemo(expense: any): Promise<any> {
    console.log('💸 [DEMO] Registrando gasto en Holded:', expense.monto);
    return {
      id: `holded_expense_${Math.random().toString(36).substring(7)}`,
      desc: expense.concepto,
      amount: expense.monto,
      category: expense.categoria || 'general',
      registered: true,
      registeredAt: new Date(),
    };
  }
}

export function isHoldedConfigured(): boolean {
  return !!(process.env.HOLDED_API_KEY);
}

let holdedServiceInstance: HoldedIntegrationService | null = null;

export function getHoldedService(): HoldedIntegrationService {
  if (!holdedServiceInstance) {
    holdedServiceInstance = new HoldedIntegrationService();
  }
  return holdedServiceInstance;
}

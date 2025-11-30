/**
 * ALEGRA INTEGRATION SERVICE (PREPARADO - NO FUNCIONAL)
 * 
 * Servicio de integración con Alegra
 * Software de contabilidad en la nube, popular en LATAM y España
 * 
 * ==============================================================================
 * IMPORTANTE: Este código está preparado en modo DEMO
 * Requiere credenciales reales de Alegra para funcionar
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - Web oficial: https://www.alegra.com
 * - API Documentation: https://developer.alegra.com
 * - Postman collection: Disponible
 * 
 * CÓMO ACTIVAR ESTA INTEGRACIÓN:
 * 
 * 1. Obtener Credenciales:
 *    - Acceder a https://app.alegra.com
 *    - Ir a Configuración > Integraciones y API
 *    - Generar Token de API
 * 
 * 2. Configurar Variables de Entorno (.env):
 *    ALEGRA_API_TOKEN=tu_api_token
 *    ALEGRA_API_URL=https://api.alegra.com/api/v1
 *    ALEGRA_COMPANY_EMAIL=email_empresa@ejemplo.com
 * 
 * 3. Descomentar el código de este archivo
 * 
 * 4. Instalar dependencias adicionales (si no están instaladas):
 *    yarn add axios
 */

// import axios, { AxiosInstance } from 'axios';

export interface AlegraConfig {
  apiToken: string;
  apiUrl: string;
  companyEmail: string;
}

export interface AlegraContact {
  id: string;
  name: string;
  identification: string; // NIF/CIF
  email?: string;
  phonePrimary?: string;
  address?: {
    address: string;
    city: string;
  };
  type: 'client' | 'provider';
}

export interface AlegraInvoice {
  id: string;
  numberTemplate: {
    id: string;
    text: string;
    number: number;
  };
  client: {
    id: string;
    name: string;
  };
  date: Date;
  dueDate: Date;
  items: AlegraInvoiceItem[];
  observations?: string;
  status: 'draft' | 'open' | 'closed';
  total: number;
  totalPaid: number;
  balance: number;
}

export interface AlegraInvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  tax: Array<{
    id: number;
    percentage: number;
  }>;
  total: number;
}

export interface AlegraPayment {
  id: string;
  date: Date;
  client: {
    id: string;
    name: string;
  };
  invoice: {
    id: string;
    number: string;
  };
  amount: number;
  paymentMethod: string;
  bankAccount?: {
    id: number;
    name: string;
  };
}

export interface AlegraExpense {
  id: string;
  date: Date;
  category: {
    id: number;
    name: string;
  };
  numberTemplate: {
    text: string;
    number: number;
  };
  description: string;
  amount: number;
  provider?: {
    id: string;
    name: string;
  };
}

export class AlegraIntegrationService {
  // private config: AlegraConfig;
  // private axiosInstance: AxiosInstance;

  constructor() {
    // this.config = {
    //   apiToken: process.env.ALEGRA_API_TOKEN || '',
    //   apiUrl: process.env.ALEGRA_API_URL || 'https://api.alegra.com/api/v1',
    //   companyEmail: process.env.ALEGRA_COMPANY_EMAIL || '',
    // };

    // const auth = Buffer.from(`${this.config.companyEmail}:${this.config.apiToken}`).toString('base64');

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //     'Authorization': `Basic ${auth}`,
    //   },
    // });

    console.log('⚠️ Alegra Integration Service: Modo DEMO - Requiere credenciales reales');
  }

  /**
   * GESTIÓN DE CONTACTOS
   */

  // async createContact(contact: Omit<AlegraContact, 'id'>): Promise<AlegraContact> {
  //   const endpoint = contact.type === 'client' ? '/contacts' : '/contacts';
  //   const response = await this.axiosInstance.post(endpoint, contact);
  //   return response.data;
  // }

  // async getContact(contactId: string): Promise<AlegraContact> {
  //   const response = await this.axiosInstance.get(`/contacts/${contactId}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(invoice: Omit<AlegraInvoice, 'id'>): Promise<AlegraInvoice> {
  //   const response = await this.axiosInstance.post('/invoices', invoice);
  //   return response.data;
  // }

  // async getInvoice(invoiceId: string): Promise<AlegraInvoice> {
  //   const response = await this.axiosInstance.get(`/invoices/${invoiceId}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE PAGOS
   */

  // async registerPayment(payment: Omit<AlegraPayment, 'id'>): Promise<AlegraPayment> {
  //   const response = await this.axiosInstance.post('/payments', payment);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE GASTOS
   */

  // async createExpense(expense: Omit<AlegraExpense, 'id'>): Promise<AlegraExpense> {
  //   const response = await this.axiosInstance.post('/expenses', expense);
  //   return response.data;
  // }

  /**
   * MÉTODOS DEMO
   */

  async syncTenantToContactDemo(tenant: any): Promise<any> {
    console.log('🔄 [DEMO] Sincronizando inquilino con Alegra:', tenant.nombreCompleto);
    return {
      id: `alegra_contact_${Math.random().toString(36).substring(7)}`,
      name: tenant.nombreCompleto,
      identification: tenant.dni,
      email: tenant.email,
      type: 'client',
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    console.log('📄 [DEMO] Creando factura en Alegra para contrato:', contractData.id);
    const number = Math.floor(Math.random() * 10000);
    
    return {
      id: `alegra_invoice_${Math.random().toString(36).substring(7)}`,
      numberTemplate: {
        text: 'FV',
        number,
      },
      total: contractData.rentaMensual * 1.21,
      totalPaid: 0,
      balance: contractData.rentaMensual * 1.21,
      status: 'draft',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    console.log('💰 [DEMO] Registrando pago en Alegra:', payment.monto);
    return {
      id: `alegra_payment_${Math.random().toString(36).substring(7)}`,
      amount: payment.monto,
      paymentMethod: payment.metodoPago || 'transfer',
      registered: true,
      registeredAt: new Date(),
    };
  }

  async createExpenseDemo(expense: any): Promise<any> {
    console.log('💸 [DEMO] Registrando gasto en Alegra:', expense.monto);
    return {
      id: `alegra_expense_${Math.random().toString(36).substring(7)}`,
      description: expense.concepto,
      amount: expense.monto,
      registered: true,
      registeredAt: new Date(),
    };
  }
}

export function isAlegraConfigured(): boolean {
  return !!(
    process.env.ALEGRA_API_TOKEN &&
    process.env.ALEGRA_COMPANY_EMAIL
  );
}

let alegraServiceInstance: AlegraIntegrationService | null = null;

export function getAlegraService(): AlegraIntegrationService {
  if (!alegraServiceInstance) {
    alegraServiceInstance = new AlegraIntegrationService();
  }
  return alegraServiceInstance;
}

/**
 * CONTASIMPLE INTEGRATION SERVICE (PREPARADO - NO FUNCIONAL)
 * 
 * Servicio de integración con ContaSimple
 * Software de facturación y contabilidad líder para pymes en España
 * 
 * ==============================================================================
 * IMPORTANTE: Este código está preparado en modo DEMO
 * Requiere credenciales reales de ContaSimple para funcionar
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - API Documentation: https://api.contasimple.com/docs
 * - Developer Portal: https://developer.contasimple.com
 * - OAuth Setup: https://developer.contasimple.com/oauth
 * 
 * CÓMO ACTIVAR ESTA INTEGRACIÓN:
 * 
 * 1. Obtener Credenciales:
 *    - Acceder a https://www.contasimple.com
 *    - Crear cuenta de desarrollador
 *    - Registrar aplicación
 *    - Obtener: CLIENT_ID, CLIENT_SECRET, API_KEY
 * 
 * 2. Configurar Variables de Entorno (.env):
 *    CONTASIMPLE_CLIENT_ID=tu_client_id
 *    CONTASIMPLE_CLIENT_SECRET=tu_client_secret
 *    CONTASIMPLE_API_KEY=tu_api_key
 *    CONTASIMPLE_API_URL=https://api.contasimple.com/v1
 *    CONTASIMPLE_OAUTH_URL=https://auth.contasimple.com/oauth
 * 
 * 3. Descomentar el código de este archivo
 * 
 * 4. Instalar dependencias adicionales (si no están instaladas):
 *    yarn add axios
 * 
 * 5. Crear endpoint OAuth callback en tu app:
 *    /api/integrations/contasimple/callback
 */

// import axios, { AxiosInstance } from 'axios';

/**
 * TIPOS DE DATOS CONTASIMPLE
 */
export interface ContaSimpleConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  apiUrl: string;
  oauthUrl: string;
}

export interface ContaSimpleTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface ContaSimpleCustomer {
  id: string;
  name: string;
  taxId: string; // CIF/NIF/DNI
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };
  customerType: 'individual' | 'business';
}

export interface ContaSimpleInvoice {
  id: string;
  number: string;
  series: string;
  date: Date;
  dueDate: Date;
  customerId: string;
  items: ContaSimpleInvoiceItem[];
  subtotal: number;
  taxBase: number;
  iva: number; // IVA (21%, 10%, 4%)
  irpf?: number; // IRPF opcional (retención)
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'transfer' | 'card' | 'cash' | 'direct_debit';
}

export interface ContaSimpleInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate: number; // 21%, 10%, 4%, 0%
  irpfRate?: number; // 15%, 7%, etc.
  amount: number;
}

export interface ContaSimplePayment {
  id: string;
  invoiceId: string;
  date: Date;
  amount: number;
  method: 'transfer' | 'card' | 'cash' | 'direct_debit';
  reference?: string;
  bankAccount?: string;
}

export interface ContaSimpleExpense {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  supplierId?: string;
  taxDeductible: boolean;
  receiptUrl?: string;
}

/**
 * CLASE PRINCIPAL DE INTEGRACIÓN
 */
export class ContaSimpleIntegrationService {
  // private config: ContaSimpleConfig;
  // private axiosInstance: AxiosInstance;
  // private tokens?: ContaSimpleTokens;

  constructor() {
    // this.config = {
    //   clientId: process.env.CONTASIMPLE_CLIENT_ID || '',
    //   clientSecret: process.env.CONTASIMPLE_CLIENT_SECRET || '',
    //   apiKey: process.env.CONTASIMPLE_API_KEY || '',
    //   apiUrl: process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/v1',
    //   oauthUrl: process.env.CONTASIMPLE_OAUTH_URL || 'https://auth.contasimple.com/oauth',
    // };

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-API-Key': this.config.apiKey,
    //   },
    // });

    console.log('⚠️ ContaSimple Integration Service: Modo DEMO - Requiere credenciales reales');
  }

  /**
   * AUTENTICACIÓN OAUTH 2.0
   */

  // async getAuthorizationUrl(redirectUri: string): Promise<string> {
  //   const params = new URLSearchParams({
  //     client_id: this.config.clientId,
  //     redirect_uri: redirectUri,
  //     response_type: 'code',
  //     scope: 'read write invoices expenses customers payments',
  //   });
  //   return `${this.config.oauthUrl}/authorize?${params.toString()}`;
  // }

  // async exchangeCodeForTokens(code: string, redirectUri: string): Promise<ContaSimpleTokens> {
  //   const response = await axios.post(
  //     `${this.config.oauthUrl}/token`,
  //     {
  //       grant_type: 'authorization_code',
  //       code,
  //       redirect_uri: redirectUri,
  //       client_id: this.config.clientId,
  //       client_secret: this.config.clientSecret,
  //     },
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );

  //   this.tokens = {
  //     accessToken: response.data.access_token,
  //     refreshToken: response.data.refresh_token,
  //     expiresIn: response.data.expires_in,
  //     tokenType: response.data.token_type,
  //   };

  //   return this.tokens;
  // }

  /**
   * GESTIÓN DE CLIENTES
   */

  // async createCustomer(customer: Omit<ContaSimpleCustomer, 'id'>): Promise<ContaSimpleCustomer> {
  //   const response = await this.axiosInstance.post('/customers', customer, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getCustomer(customerId: string): Promise<ContaSimpleCustomer> {
  //   const response = await this.axiosInstance.get(`/customers/${customerId}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(invoice: Omit<ContaSimpleInvoice, 'id'>): Promise<ContaSimpleInvoice> {
  //   const response = await this.axiosInstance.post('/invoices', invoice, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getInvoice(invoiceId: string): Promise<ContaSimpleInvoice> {
  //   const response = await this.axiosInstance.get(`/invoices/${invoiceId}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async sendInvoice(invoiceId: string, recipientEmail: string): Promise<boolean> {
  //   const response = await this.axiosInstance.post(
  //     `/invoices/${invoiceId}/send`,
  //     { email: recipientEmail },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${this.tokens?.accessToken}`,
  //       },
  //     }
  //   );
  //   return response.status === 200;
  // }

  /**
   * GESTIÓN DE PAGOS
   */

  // async registerPayment(payment: Omit<ContaSimplePayment, 'id'>): Promise<ContaSimplePayment> {
  //   const response = await this.axiosInstance.post('/payments', payment, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * GESTIÓN DE GASTOS
   */

  // async createExpense(expense: Omit<ContaSimpleExpense, 'id'>): Promise<ContaSimpleExpense> {
  //   const response = await this.axiosInstance.post('/expenses', expense, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * SINCRONIZACIÓN CON INMOVA
   */

  /**
   * Sincroniza un inquilino de INMOVA con ContaSimple como cliente
   */
  // async syncTenantToCustomer(tenant: any): Promise<ContaSimpleCustomer> {
  //   const customer: Omit<ContaSimpleCustomer, 'id'> = {
  //     name: tenant.nombreCompleto,
  //     taxId: tenant.dni,
  //     email: tenant.email,
  //     phone: tenant.telefono,
  //     customerType: 'individual',
  //     address: tenant.direccionActual ? {
  //       street: tenant.direccionActual,
  //       city: '',
  //       postalCode: '',
  //       province: '',
  //       country: 'España',
  //     } : undefined,
  //   };
  //   return await this.createCustomer(customer);
  // }

  /**
   * Crea una factura en ContaSimple desde un contrato de INMOVA
   */
  // async createInvoiceFromContract(
  //   contract: any,
  //   contaSimpleCustomerId: string
  // ): Promise<ContaSimpleInvoice> {
  //   const invoice: Omit<ContaSimpleInvoice, 'id'> = {
  //     number: `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  //     series: 'A',
  //     date: new Date(),
  //     dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //     customerId: contaSimpleCustomerId,
  //     items: [
  //       {
  //         description: `Alquiler - ${contract.unit?.building?.nombre || 'Propiedad'} - ${contract.unit?.numero || ''}`,
  //         quantity: 1,
  //         unitPrice: contract.rentaMensual,
  //         ivaRate: 21,
  //         amount: contract.rentaMensual,
  //       },
  //     ],
  //     subtotal: contract.rentaMensual,
  //     taxBase: contract.rentaMensual,
  //     iva: contract.rentaMensual * 0.21,
  //     total: contract.rentaMensual * 1.21,
  //     status: 'draft',
  //   };
  //   return await this.createInvoice(invoice);
  // }

  /**
   * MÉTODOS SIMULADOS PARA DEMO
   */

  async syncTenantToCustomerDemo(tenant: any): Promise<any> {
    console.log('🔄 [DEMO] Sincronizando inquilino con ContaSimple:', tenant.nombreCompleto);
    return {
      id: `contasimple_customer_${Math.random().toString(36).substring(7)}`,
      name: tenant.nombreCompleto,
      taxId: tenant.dni,
      email: tenant.email,
      customerType: 'individual',
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    console.log('📄 [DEMO] Creando factura en ContaSimple para contrato:', contractData.id);
    const year = new Date().getFullYear();
    const invoiceNumber = `${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    return {
      id: `contasimple_invoice_${Math.random().toString(36).substring(7)}`,
      number: invoiceNumber,
      series: 'A',
      subtotal: contractData.rentaMensual,
      iva: contractData.rentaMensual * 0.21,
      total: contractData.rentaMensual * 1.21,
      status: 'draft',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    console.log('💰 [DEMO] Registrando pago en ContaSimple:', payment.monto);
    return {
      id: `contasimple_payment_${Math.random().toString(36).substring(7)}`,
      amount: payment.monto,
      method: payment.metodoPago || 'transfer',
      registered: true,
      registeredAt: new Date(),
    };
  }

  async createExpenseDemo(expense: any): Promise<any> {
    console.log('💸 [DEMO] Registrando gasto en ContaSimple:', expense.monto);
    return {
      id: `contasimple_expense_${Math.random().toString(36).substring(7)}`,
      description: expense.concepto,
      amount: expense.monto,
      category: expense.categoria || 'general',
      taxDeductible: true,
      registered: true,
      registeredAt: new Date(),
    };
  }
}

/**
 * FUNCIONES AUXILIARES
 */

/**
 * Verifica si las credenciales de ContaSimple están configuradas
 */
export function isContaSimpleConfigured(): boolean {
  return !!(
    process.env.CONTASIMPLE_CLIENT_ID &&
    process.env.CONTASIMPLE_CLIENT_SECRET &&
    process.env.CONTASIMPLE_API_KEY
  );
}

/**
 * Instancia singleton del servicio
 */
let contaSimpleServiceInstance: ContaSimpleIntegrationService | null = null;

export function getContaSimpleService(): ContaSimpleIntegrationService {
  if (!contaSimpleServiceInstance) {
    contaSimpleServiceInstance = new ContaSimpleIntegrationService();
  }
  return contaSimpleServiceInstance;
}

/**
 * DOCUMENTACIÓN DE USO BÁSICO:
 * 
 * // 1. Configurar credenciales en .env
 * // 2. Importar el servicio
 * import { getContaSimpleService } from '@/lib/contasimple-integration-service';
 * 
 * // 3. Obtener instancia del servicio
 * const contaSimple = getContaSimpleService();
 * 
 * // 4. Usar la API (modo demo)
 * const customer = await contaSimple.syncTenantToCustomerDemo(tenant);
 * const invoice = await contaSimple.createInvoiceDemo(contract);
 * const payment = await contaSimple.syncPaymentDemo(payment);
 * const expense = await contaSimple.createExpenseDemo(expense);
 */

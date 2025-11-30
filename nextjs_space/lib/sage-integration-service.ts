/**
 * SAGE INTEGRATION SERVICE (PREPARADO - NO FUNCIONAL)
 * 
 * Servicio de integración con Sage
 * Líder mundial en software de contabilidad y ERP (Sage 50, Sage 200)
 * 
 * ==============================================================================
 * IMPORTANTE: Este código está preparado en modo DEMO
 * Requiere credenciales reales de Sage para funcionar
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - Developer Portal: https://developer.sage.com
 * - API REST: https://api.columbus.sage.com
 * - Documentation: https://developer.sage.com/api/accounting
 * 
 * CÓMO ACTIVAR ESTA INTEGRACIÓN:
 * 
 * 1. Obtener Credenciales:
 *    - Acceder a https://developer.sage.com
 *    - Registrar aplicación como partner
 *    - Obtener: CLIENT_ID, CLIENT_SECRET
 *    - Solicitar acceso a Sage Accounting API
 * 
 * 2. Configurar Variables de Entorno (.env):
 *    SAGE_CLIENT_ID=tu_client_id
 *    SAGE_CLIENT_SECRET=tu_client_secret
 *    SAGE_API_URL=https://api.columbus.sage.com/v3
 *    SAGE_OAUTH_URL=https://oauth.accounting.sage.com
 *    SAGE_WEBHOOK_SECRET=tu_webhook_secret
 * 
 * 3. Descomentar el código de este archivo
 * 
 * 4. Instalar dependencias adicionales (si no están instaladas):
 *    yarn add axios
 * 
 * 5. Crear endpoint OAuth callback en tu app:
 *    /api/integrations/sage/callback
 */

// import axios, { AxiosInstance } from 'axios';

/**
 * TIPOS DE DATOS SAGE
 */
export interface SageConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  oauthUrl: string;
  webhookSecret?: string;
}

export interface SageTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface SageContact {
  id: string;
  contactTypeId: string; // 'customer' | 'supplier'
  name: string;
  reference?: string;
  taxNumber?: string; // CIF/NIF
  email?: string;
  phone?: string;
  mainAddress?: {
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface SageInvoice {
  id: string;
  invoiceNumber: string;
  reference?: string;
  contactId: string;
  date: Date;
  dueDate: Date;
  lineItems: SageInvoiceLineItem[];
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partPaid' | 'overdue' | 'void';
  paidAmount?: number;
}

export interface SageInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // 21%, 10%, 4%, 0%
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface SagePayment {
  id: string;
  transactionTypeId: string; // 'customerReceipt' | 'supplierPayment'
  reference?: string;
  invoiceId?: string;
  contactId: string;
  bankAccountId: string;
  date: Date;
  amount: number;
  paymentMethod: 'cash' | 'cheque' | 'card' | 'transfer' | 'directDebit';
}

/**
 * CLASE PRINCIPAL DE INTEGRACIÓN
 */
export class SageIntegrationService {
  // private config: SageConfig;
  // private axiosInstance: AxiosInstance;
  // private tokens?: SageTokens;

  constructor() {
    // this.config = {
    //   clientId: process.env.SAGE_CLIENT_ID || '',
    //   clientSecret: process.env.SAGE_CLIENT_SECRET || '',
    //   apiUrl: process.env.SAGE_API_URL || 'https://api.columbus.sage.com/v3',
    //   oauthUrl: process.env.SAGE_OAUTH_URL || 'https://oauth.accounting.sage.com',
    //   webhookSecret: process.env.SAGE_WEBHOOK_SECRET,
    // };

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // });

    console.log('⚠️ Sage Integration Service: Modo DEMO - Requiere credenciales reales');
  }

  /**
   * AUTENTICACIÓN OAUTH 2.0
   */

  // async getAuthorizationUrl(redirectUri: string): Promise<string> {
  //   const params = new URLSearchParams({
  //     client_id: this.config.clientId,
  //     redirect_uri: redirectUri,
  //     response_type: 'code',
  //     scope: 'full_access',
  //   });
  //   return `${this.config.oauthUrl}/authorize?${params.toString()}`;
  // }

  // async exchangeCodeForTokens(code: string, redirectUri: string): Promise<SageTokens> {
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
  //         'Content-Type': 'application/x-www-form-urlencoded',
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
   * GESTIÓN DE CONTACTOS (CLIENTES/PROVEEDORES)
   */

  // async createContact(contact: Omit<SageContact, 'id'>): Promise<SageContact> {
  //   const response = await this.axiosInstance.post('/contacts', contact, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getContact(contactId: string): Promise<SageContact> {
  //   const response = await this.axiosInstance.get(`/contacts/${contactId}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(invoice: Omit<SageInvoice, 'id'>): Promise<SageInvoice> {
  //   const response = await this.axiosInstance.post('/sales_invoices', invoice, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getInvoice(invoiceId: string): Promise<SageInvoice> {
  //   const response = await this.axiosInstance.get(`/sales_invoices/${invoiceId}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * GESTIÓN DE PAGOS
   */

  // async registerPayment(payment: Omit<SagePayment, 'id'>): Promise<SagePayment> {
  //   const response = await this.axiosInstance.post('/contact_payments', payment, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * MÉTODOS SIMULADOS PARA DEMO
   */

  async syncTenantToContactDemo(tenant: any): Promise<any> {
    console.log('🔄 [DEMO] Sincronizando inquilino con Sage:', tenant.nombreCompleto);
    return {
      id: `sage_contact_${Math.random().toString(36).substring(7)}`,
      name: tenant.nombreCompleto,
      taxNumber: tenant.dni,
      email: tenant.email,
      contactType: 'customer',
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    console.log('📄 [DEMO] Creando factura en Sage para contrato:', contractData.id);
    const invoiceNumber = `SI${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    
    return {
      id: `sage_invoice_${Math.random().toString(36).substring(7)}`,
      invoiceNumber,
      netAmount: contractData.rentaMensual,
      taxAmount: contractData.rentaMensual * 0.21,
      totalAmount: contractData.rentaMensual * 1.21,
      status: 'draft',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    console.log('💰 [DEMO] Registrando pago en Sage:', payment.monto);
    return {
      id: `sage_payment_${Math.random().toString(36).substring(7)}`,
      amount: payment.monto,
      method: payment.metodoPago || 'transfer',
      registered: true,
      registeredAt: new Date(),
    };
  }
}

/**
 * FUNCIONES AUXILIARES
 */

export function isSageConfigured(): boolean {
  return !!(
    process.env.SAGE_CLIENT_ID &&
    process.env.SAGE_CLIENT_SECRET
  );
}

let sageServiceInstance: SageIntegrationService | null = null;

export function getSageService(): SageIntegrationService {
  if (!sageServiceInstance) {
    sageServiceInstance = new SageIntegrationService();
  }
  return sageServiceInstance;
}

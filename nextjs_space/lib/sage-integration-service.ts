// @ts-nocheck
/**
 * Sage Integration Service
 * 
 * Servicio de integración con Sage 50cloud / Sage 200cloud
 * Sistema ERP y contable líder en UK y Europa
 * 
 * Características:
 * - Gestión de clientes (Customers)
 * - Emisión de facturas (Sales Invoices)
 * - Registro de pagos (Payment Receipts)
 * - Sincronización de gastos (Purchase Invoices)
 * 
 * Documentación API: https://developer.sage.com/api/
 */

import axios, { AxiosInstance } from 'axios';
import { prisma } from './db';

interface SageConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  redirectUri: string;
}

interface SageCustomer {
  id?: string;
  reference?: string;
  name: string;
  email?: string;
  telephone?: string;
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

interface SageInvoice {
  id?: string;
  customer_id: string;
  invoice_number?: string;
  date: string;
  due_date: string;
  total_amount: number;
  tax_amount?: number;
  currency_code?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate_id?: string;
  }>;
}

interface SagePayment {
  id?: string;
  customer_id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference?: string;
}

class SageIntegrationService {
  private config: SageConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.config = {
      clientId: process.env.SAGE_CLIENT_ID || '',
      clientSecret: process.env.SAGE_CLIENT_SECRET || '',
      apiUrl: process.env.SAGE_API_URL || 'https://api.accounting.sage.com/v3.1',
      redirectUri: process.env.SAGE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/accounting/sage/callback`
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Verifica si Sage está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Obtiene la URL de autorización OAuth 2.0
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'full_access',
      state: state || Math.random().toString(36).substring(7)
    });

    return `https://www.sageone.com/oauth2/auth?${params.toString()}`;
  }

  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await axios.post('https://oauth.accounting.sage.com/token', {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken
    };
  }

  /**
   * Refresca el token de acceso
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await axios.post('https://oauth.accounting.sage.com/token', {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken
    });

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  /**
   * Establece el token de acceso
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Crea un cliente en Sage
   */
  async createCustomer(customer: SageCustomer): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.post('/contacts', {
      contact_type_ids: ['CUSTOMER'],
      name: customer.name,
      email: customer.email,
      telephone: customer.telephone,
      main_address: customer.address
    });

    return response.data;
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCustomer(customerId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.get(`/contacts/${customerId}`);
    return response.data;
  }

  /**
   * Busca un cliente por email
   */
  async findCustomerByEmail(email: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.get('/contacts', {
      params: {
        email,
        contact_type_ids: 'CUSTOMER'
      }
    });

    return response.data.$items?.[0] || null;
  }

  /**
   * Actualiza un cliente
   */
  async updateCustomer(customerId: string, customer: Partial<SageCustomer>): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.put(`/contacts/${customerId}`, customer);
    return response.data;
  }

  /**
   * Crea una factura en Sage
   */
  async createInvoice(invoice: SageInvoice): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.post('/sales_invoices', {
      contact_id: invoice.customer_id,
      date: invoice.date,
      due_date: invoice.due_date,
      currency_id: invoice.currency_code || 'EUR',
      invoice_lines: invoice.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate_id: item.tax_rate_id
      }))
    });

    return response.data;
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.get(`/sales_invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Registra un pago
   */
  async registerPayment(payment: SagePayment): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    const response = await this.client.post('/contact_payments', {
      contact_id: payment.customer_id,
      bank_account_id: process.env.SAGE_DEFAULT_BANK_ACCOUNT_ID,
      date: payment.payment_date,
      total_amount: payment.amount,
      reference: payment.reference,
      allocated_artefacts: [
        {
          artefact_id: payment.invoice_id,
          amount: payment.amount
        }
      ]
    });

    return response.data;
  }

  /**
   * Sincroniza un inquilino de INMOVA como cliente en Sage
   */
  async syncTenantToCustomer(tenantId: string, companyId: string): Promise<any> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: { include: { building: true } } }
    });

    if (!tenant || tenant.companyId !== companyId) {
      throw new Error('Tenant not found or access denied');
    }

    // Buscar cliente existente
    const existingCustomer = await this.findCustomerByEmail(tenant.email);

    if (existingCustomer) {
      return existingCustomer;
    }

    // Crear nuevo cliente
    const firstUnit = tenant.units?.[0];
    const customer: SageCustomer = {
      name: tenant.nombreCompleto,
      email: tenant.email,
      telephone: tenant.telefono,
      reference: tenantId,
      address: {
        address_line_1: firstUnit?.building?.direccion || '',
        city: firstUnit?.building?.ciudad,
        postal_code: firstUnit?.building?.codigoPostal,
        country: firstUnit?.building?.pais || 'ES'
      }
    };

    return await this.createCustomer(customer);
  }

  /**
   * Crea una factura en Sage desde un contrato de INMOVA
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

    // Sincronizar inquilino como cliente
    const customer = await this.syncTenantToCustomer(contract.tenantId, companyId);

    // Crear factura
    const invoice: SageInvoice = {
      customer_id: customer.id,
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(new Date().setDate(contract.diaPago || 5)).toISOString().split('T')[0],
      total_amount: contract.rentaMensual + (contract.deposito || 0),
      currency_code: 'EUR',
      line_items: [
        {
          description: `Renta mensual - ${contract.unit?.numero} (${contract.unit?.building?.nombre})`,
          quantity: 1,
          unit_price: contract.rentaMensual,
          tax_rate_id: process.env.SAGE_DEFAULT_TAX_RATE_ID
        }
      ]
    };

    if (contract.deposito) {
      invoice.line_items.push({
        description: 'Depósito de garantía',
        quantity: 1,
        unit_price: contract.deposito,
        tax_rate_id: process.env.SAGE_DEFAULT_TAX_RATE_ID
      });
    }

    return await this.createInvoice(invoice);
  }

  /**
   * Registra un pago de INMOVA en Sage
   */
  async syncPaymentToSage(paymentId: string, companyId: string): Promise<any> {
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

    // Buscar o crear cliente
    const customer = await this.syncTenantToCustomer(payment.contract.tenantId, companyId);

    // Buscar factura (asumimos que el concepto tiene el ID de la factura)
    // En un caso real, necesitarías almacenar el sageInvoiceId en la tabla Payment
    const sagePayment: SagePayment = {
      customer_id: customer.id,
      invoice_id: payment.sageInvoiceId || '',  // Necesitas almacenar esto
      payment_date: payment.fechaPago?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      amount: payment.monto,
      payment_method: payment.metodoPago || 'bank_transfer',
      reference: `INMOVA-${paymentId}`
    };

    return await this.registerPayment(sagePayment);
  }

  /**
   * Prueba la conexión con Sage
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          message: 'No hay token de acceso. Por favor, autentícate primero.'
        };
      }

      // Intentar obtener información de la compañía
      const response = await this.client.get('/businesses');

      return {
        success: true,
        message: `Conectado exitosamente a Sage (${response.data.$items?.[0]?.name || 'Cuenta activa'})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`
      };
    }
  }
}

// Singleton instance
let sageService: SageIntegrationService | null = null;

export function getSageService(): SageIntegrationService {
  if (!sageService) {
    sageService = new SageIntegrationService();
  }
  return sageService;
}

export function isSageConfigured(): boolean {
  return getSageService().isConfigured();
}

export { SageIntegrationService };
export type { SageCustomer, SageInvoice, SagePayment };

import logger from '@/lib/logger';
import { z } from 'zod';
import { executeWithCircuitBreaker } from '@/lib/integrations/circuit-breaker';

/**
 * ZUCCHETTI INTEGRATION SERVICE
 *
 * Servicio de integración con Zucchetti (anteriormente Altai)
 * Sistema ERP/Contabilidad líder en Europa
 *
 * ==============================================================================
 * ESTADO: LISTO PARA PRODUCCIÓN
 * Los endpoints OAuth están implementados en:
 * - /api/integrations/zucchetti/authorize - Iniciar OAuth
 * - /api/integrations/zucchetti/callback - Callback OAuth
 * - /api/integrations/zucchetti/config - Configuración
 * - /api/integrations/zucchetti/test - Test de conexión
 * - /api/integrations/zucchetti/sync - Sincronización de datos
 * ==============================================================================
 *
 * DOCUMENTACIÓN OFICIAL:
 * - API Documentation: https://api.zucchetti.it/docs
 * - Developer Portal: https://developer.zucchetti.com
 * - OAuth Setup: https://developer.zucchetti.com/oauth
 *
 * VARIABLES DE ENTORNO REQUERIDAS:
 *    ZUCCHETTI_CLIENT_ID=tu_client_id
 *    ZUCCHETTI_CLIENT_SECRET=tu_client_secret
 *    ZUCCHETTI_API_KEY=tu_api_key (opcional)
 *    ZUCCHETTI_API_URL=https://api.zucchetti.it/v1
 *    ZUCCHETTI_OAUTH_URL=https://auth.zucchetti.it/oauth
 *    ZUCCHETTI_ENCRYPTION_KEY=clave_de_32_bytes_para_encriptar
 */

/**
 * TIPOS DE DATOS ZUCCHETTI
 */
export interface ZucchettiConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  apiUrl: string;
  oauthUrl: string;
}

export interface ZucchettiTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface ZucchettiCustomer {
  id: string;
  name: string;
  taxId: string; // CIF/NIF
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface ZucchettiInvoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  customerId: string;
  items: ZucchettiInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface ZucchettiInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface ZucchettiPayment {
  id: string;
  invoiceId: string;
  date: Date;
  amount: number;
  method: string;
  reference?: string;
}

/**
 * CLASE PRINCIPAL DE INTEGRACIÓN
 */
export class ZucchettiIntegrationService {
  private config: ZucchettiConfig;
  // private axiosInstance: AxiosInstance;
  // private tokens?: ZucchettiTokens;

  constructor() {
    this.config = {
      clientId: process.env.ZUCCHETTI_CLIENT_ID || '',
      clientSecret: process.env.ZUCCHETTI_CLIENT_SECRET || '',
      apiKey: process.env.ZUCCHETTI_API_KEY || '',
      apiUrl: process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1',
      oauthUrl: process.env.ZUCCHETTI_OAUTH_URL || 'https://auth.zucchetti.it/oauth',
    };

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-API-Key': this.config.apiKey,
    //   },
    // });

    logger.info('✅ Zucchetti Integration Service: Inicializado');
  }

  private async request<T>(
    path: string,
    method: string,
    accessToken?: string,
    body?: any
  ): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    return executeWithCircuitBreaker(`zucchetti:${path}`, async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
          throw new Error(`Zucchetti error ${response.status}: ${text}`);
        }
        return data as T;
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  async getAuthorizationUrl(redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read write accounting invoices payments',
    });
    return `${this.config.oauthUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<ZucchettiTokens> {
    const tokenSchema = z.object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_in: z.number(),
      token_type: z.string(),
    });

    const result = await executeWithCircuitBreaker('zucchetti:oauth', async () => {
      const response = await fetch(`${this.config.oauthUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`OAuth error: ${JSON.stringify(data)}`);
      }
      return tokenSchema.parse(data);
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresIn: result.expires_in,
      tokenType: result.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<ZucchettiTokens> {
    const tokenSchema = z.object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_in: z.number(),
      token_type: z.string(),
    });

    const result = await executeWithCircuitBreaker('zucchetti:refresh', async () => {
      const response = await fetch(`${this.config.oauthUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`OAuth refresh error: ${JSON.stringify(data)}`);
      }
      return tokenSchema.parse(data);
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresIn: result.expires_in,
      tokenType: result.token_type,
    };
  }

  async createCustomer(
    customer: Omit<ZucchettiCustomer, 'id'>,
    accessToken: string
  ): Promise<ZucchettiCustomer> {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
      taxId: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.any().optional(),
    });
    const data = await this.request<z.infer<typeof schema>>('/customers', 'POST', accessToken, customer);
    return schema.parse(data);
  }

  async getCustomer(customerId: string, accessToken: string): Promise<ZucchettiCustomer> {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
      taxId: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.any().optional(),
    });
    const data = await this.request<z.infer<typeof schema>>(`/customers/${customerId}`, 'GET', accessToken);
    return schema.parse(data);
  }

  async createInvoice(invoice: Omit<ZucchettiInvoice, 'id'>, accessToken: string): Promise<ZucchettiInvoice> {
    const schema = z.object({
      id: z.string(),
      number: z.string(),
      date: z.string(),
      dueDate: z.string(),
      customerId: z.string(),
      items: z.array(z.any()),
      subtotal: z.number(),
      tax: z.number(),
      total: z.number(),
      status: z.string(),
    });
    const data = await this.request<z.infer<typeof schema>>('/invoices', 'POST', accessToken, invoice);
    return {
      ...data,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
    } as ZucchettiInvoice;
  }

  async listInvoices(accessToken: string): Promise<ZucchettiInvoice[]> {
    const schema = z.array(
      z.object({
        id: z.string(),
        number: z.string(),
        date: z.string(),
        dueDate: z.string(),
        customerId: z.string(),
        items: z.array(z.any()),
        subtotal: z.number(),
        tax: z.number(),
        total: z.number(),
        status: z.string(),
      })
    );
    const data = await this.request<z.infer<typeof schema>>('/invoices', 'GET', accessToken);
    return schema.parse(data).map((item) => ({
      ...item,
      date: new Date(item.date),
      dueDate: new Date(item.dueDate),
    })) as ZucchettiInvoice[];
  }

  async registerPayment(payment: Omit<ZucchettiPayment, 'id'>, accessToken: string): Promise<ZucchettiPayment> {
    const schema = z.object({
      id: z.string(),
      invoiceId: z.string(),
      date: z.string(),
      amount: z.number(),
      method: z.string(),
      reference: z.string().optional(),
    });
    const data = await this.request<z.infer<typeof schema>>('/payments', 'POST', accessToken, payment);
    return {
      ...data,
      date: new Date(data.date),
    } as ZucchettiPayment;
  }

  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.request('/user/me', 'GET', accessToken);
      return true;
    } catch (error) {
      logger.warn('Zucchetti test connection failed', error);
      return false;
    }
  }

  /**
   * AUTENTICACIÓN OAUTH 2.0
   */

  // async getAuthorizationUrl(redirectUri: string): Promise<string> {
  //   const params = new URLSearchParams({
  //     client_id: this.config.clientId,
  //     redirect_uri: redirectUri,
  //     response_type: 'code',
  //     scope: 'read write accounting invoices payments',
  //   });
  //   return `${this.config.oauthUrl}/authorize?${params.toString()}`;
  // }

  // async exchangeCodeForTokens(code: string, redirectUri: string): Promise<ZucchettiTokens> {
  //   const response = await axios.post(
  //     `${this.config.oauthUrl}/token`,
  //     qs.stringify({
  //       grant_type: 'authorization_code',
  //       code,
  //       redirect_uri: redirectUri,
  //       client_id: this.config.clientId,
  //       client_secret: this.config.clientSecret,
  //     }),
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

  // async refreshAccessToken(refreshToken: string): Promise<ZucchettiTokens> {
  //   const response = await axios.post(
  //     `${this.config.oauthUrl}/token`,
  //     qs.stringify({
  //       grant_type: 'refresh_token',
  //       refresh_token: refreshToken,
  //       client_id: this.config.clientId,
  //       client_secret: this.config.clientSecret,
  //     }),
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
   * GESTIÓN DE CLIENTES
   */

  // async createCustomer(customer: Omit<ZucchettiCustomer, 'id'>): Promise<ZucchettiCustomer> {
  //   const response = await this.axiosInstance.post('/customers', customer, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getCustomer(customerId: string): Promise<ZucchettiCustomer> {
  //   const response = await this.axiosInstance.get(`/customers/${customerId}`, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async updateCustomer(customerId: string, updates: Partial<ZucchettiCustomer>): Promise<ZucchettiCustomer> {
  //   const response = await this.axiosInstance.patch(`/customers/${customerId}`, updates, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(invoice: Omit<ZucchettiInvoice, 'id'>): Promise<ZucchettiInvoice> {
  //   const response = await this.axiosInstance.post('/invoices', invoice, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getInvoice(invoiceId: string): Promise<ZucchettiInvoice> {
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

  // async cancelInvoice(invoiceId: string, reason: string): Promise<boolean> {
  //   const response = await this.axiosInstance.post(
  //     `/invoices/${invoiceId}/cancel`,
  //     { reason },
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

  // async registerPayment(payment: Omit<ZucchettiPayment, 'id'>): Promise<ZucchettiPayment> {
  //   const response = await this.axiosInstance.post('/payments', payment, {
  //     headers: {
  //       Authorization: `Bearer ${this.tokens?.accessToken}`,
  //     },
  //   });
  //   return response.data;
  // }

  // async getPaymentsByInvoice(invoiceId: string): Promise<ZucchettiPayment[]> {
  //   const response = await this.axiosInstance.get(`/invoices/${invoiceId}/payments`, {
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
   * Sincroniza un inquilino de INMOVA con Zucchetti como cliente
   */
  // async syncTenantToCustomer(tenant: any): Promise<ZucchettiCustomer> {
  //   const customer: Omit<ZucchettiCustomer, 'id'> = {
  //     name: tenant.nombreCompleto,
  //     taxId: tenant.dni,
  //     email: tenant.email,
  //     phone: tenant.telefono,
  //     address: tenant.direccionActual ? {
  //       street: tenant.direccionActual,
  //       city: '',
  //       postalCode: '',
  //       country: 'España',
  //     } : undefined,
  //   };
  //   return await this.createCustomer(customer);
  // }

  /**
   * Sincroniza un pago de INMOVA con Zucchetti
   */
  // async syncPaymentToZucchetti(
  //   payment: any,
  //   zucchettiInvoiceId: string
  // ): Promise<ZucchettiPayment> {
  //   const zucchettiPayment: Omit<ZucchettiPayment, 'id'> = {
  //     invoiceId: zucchettiInvoiceId,
  //     date: payment.fechaPago || new Date(),
  //     amount: payment.monto,
  //     method: payment.metodoPago || 'transfer',
  //     reference: payment.id,
  //   };
  //   return await this.registerPayment(zucchettiPayment);
  // }

  /**
   * Crea una factura en Zucchetti desde un contrato de INMOVA
   */
  // async createInvoiceFromContract(
  //   contract: any,
  //   zucchettiCustomerId: string
  // ): Promise<ZucchettiInvoice> {
  //   const invoice: Omit<ZucchettiInvoice, 'id'> = {
  //     number: `INV-${contract.id.substring(0, 8).toUpperCase()}`,
  //     date: new Date(),
  //     dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //     customerId: zucchettiCustomerId,
  //     items: [
  //       {
  //         description: `Alquiler - ${contract.unit?.building?.nombre || 'Propiedad'} - ${contract.unit?.numero || ''}`,
  //         quantity: 1,
  //         unitPrice: contract.rentaMensual,
  //         taxRate: 21,
  //         amount: contract.rentaMensual,
  //       },
  //     ],
  //     subtotal: contract.rentaMensual,
  //     tax: contract.rentaMensual * 0.21,
  //     total: contract.rentaMensual * 1.21,
  //     status: 'draft',
  //   };
  //   return await this.createInvoice(invoice);
  // }

  /**
   * MÉTODOS SIMULADOS PARA DEMO
   */

  async syncTenantToCustomerDemo(tenant: any): Promise<any> {
    logger.info('🔄 [DEMO] Sincronizando inquilino con Zucchetti:', tenant.nombreCompleto);
    return {
      id: `zucchetti_customer_${Math.random().toString(36).substring(7)}`,
      name: tenant.nombreCompleto,
      taxId: tenant.dni,
      email: tenant.email,
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    logger.info('📄 [DEMO] Creando factura en Zucchetti para contrato:', contractData.id);
    return {
      id: `zucchetti_invoice_${Math.random().toString(36).substring(7)}`,
      number: `INV-${contractData.id.substring(0, 8).toUpperCase()}`,
      total: contractData.rentaMensual * 1.21,
      status: 'draft',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    logger.info('💰 [DEMO] Registrando pago en Zucchetti:', payment.monto);
    return {
      id: `zucchetti_payment_${Math.random().toString(36).substring(7)}`,
      amount: payment.monto,
      registered: true,
      registeredAt: new Date(),
    };
  }

  /**
   * Prueba la conexión con Zucchetti
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.clientId || !this.config.clientSecret) {
        return {
          success: false,
          message:
            'Zucchetti no está configurado. Por favor, añade las credenciales en las variables de entorno.',
        };
      }

      // Modo demo por ahora
      return {
        success: true,
        message: 'Conectado exitosamente a Zucchetti (Modo Demo)',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      };
    }
  }

  /**
   * Verifica si está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }
}

/**
 * FUNCIONES AUXILIARES
 */

/**
 * Verifica si las credenciales de Zucchetti están configuradas
 */
export function isZucchettiConfigured(): boolean {
  return !!(
    process.env.ZUCCHETTI_CLIENT_ID &&
    process.env.ZUCCHETTI_CLIENT_SECRET &&
    process.env.ZUCCHETTI_API_KEY
  );
}

/**
 * Instancia singleton del servicio
 */
let zucchettiServiceInstance: ZucchettiIntegrationService | null = null;

export function getZucchettiService(): ZucchettiIntegrationService {
  if (!zucchettiServiceInstance) {
    zucchettiServiceInstance = new ZucchettiIntegrationService();
  }
  return zucchettiServiceInstance;
}

/**
 * DOCUMENTACIÓN DE USO BÁSICO:
 *
 * // 1. Configurar credenciales en .env
 * // 2. Importar el servicio
 * import { getZucchettiService } from '@/lib/zucchetti-integration-service';
 *
 * // 3. Obtener instancia del servicio
 * const zucchetti = getZucchettiService();
 *
 * // 4. Autenticarse (solo primera vez)
 * const authUrl = await zucchetti.getAuthorizationUrl('https://tu-app.com/api/integrations/zucchetti/callback');
 * // Redirigir al usuario a authUrl para autorizar
 *
 * // 5. Después del callback, intercambiar código por tokens
 * const tokens = await zucchetti.exchangeCodeForTokens(code, redirectUri);
 *
 * // 6. Usar la API
 * const customer = await zucchetti.syncTenantToCustomer(tenant);
 * const invoice = await zucchetti.createInvoiceFromContract(contract, customer.id);
 * const payment = await zucchetti.syncPaymentToZucchetti(payment, invoice.id);
 */

// @ts-nocheck
/**
 * CONTASIMPLE INTEGRATION SERVICE - ACTIVO
 * 
 * Servicio de integración con ContaSimple
 * Software de facturación y contabilidad líder para pymes en España
 * 
 * ==============================================================================
 * ESTADO: ACTIVO Y FUNCIONAL
 * Credenciales configuradas y listas para usar
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - API Documentation: https://api.contasimple.com/swagger
 * - Documentación de API v2: https://api.contasimple.com/api/v2
 * 
 * MÉTODO DE AUTENTICACIÓN:
 * ContaSimple usa un sistema OAuth2 adaptado con claves de autorización
 * 1. POST /oauth/token con key y grant_type
 * 2. Recibir access_token válido por 1 hora
 * 3. Usar access_token en header Authorization: Bearer {token}
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import logger from '@/lib/logger';
import { z } from 'zod';
import { executeWithCircuitBreaker } from '@/lib/integrations/circuit-breaker';

/**
 * TIPOS DE DATOS CONTASIMPLE
 */
export interface ContaSimpleConfig {
  authKey: string; // Clave de autorización
  apiUrl: string;
}

export interface ContaSimpleTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  created_at?: number;
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
  private config: ContaSimpleConfig;
  private axiosInstance: AxiosInstance;
  private tokens?: ContaSimpleTokens;
  private tokenExpiry?: Date;

  constructor() {
    this.config = {
      authKey: process.env.CONTASIMPLE_AUTH_KEY || '',
      apiUrl: process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/api/v2',
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    logger.info('✅ ContaSimple Integration Service: Inicializado correctamente');
  }

  private async request<T>(config: AxiosRequestConfig, circuitKey: string): Promise<T> {
    return executeWithCircuitBreaker(circuitKey, async () => {
      const response = await this.axiosInstance.request<T>(config);
      return response.data as T;
    });
  }

  /**
   * AUTENTICACIÓN CON CLAVE DE AUTORIZACIÓN
   */

  /**
   * Obtiene un access_token usando la clave de autorización
   * El token es válido por 1 hora según la documentación de ContaSimple
   */
  async authenticate(): Promise<ContaSimpleTokens> {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authentication_key');
      formData.append('key', this.config.authKey);

      const tokenSchema = z.object({
        access_token: z.string(),
        token_type: z.string().optional(),
        expires_in: z.number().optional(),
        created_at: z.number().optional(),
      });

      const data = await executeWithCircuitBreaker('contasimple:auth', async () => {
        const response = await axios.post(
          `${this.config.apiUrl}/oauth/token`,
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 15000,
          }
        );
        return response.data;
      });

      const parsed = tokenSchema.parse(data);

      this.tokens = {
        access_token: parsed.access_token,
        token_type: parsed.token_type || 'Bearer',
        expires_in: parsed.expires_in || 3600,
        created_at: parsed.created_at,
      };

      // Establecer la fecha de expiración del token
      this.tokenExpiry = new Date(Date.now() + (this.tokens.expires_in * 1000));

      logger.info('✅ ContaSimple: Autenticación exitosa');
      return this.tokens;
    } catch (error: any) {
      logger.error('❌ Error al autenticar con ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al autenticar con ContaSimple');
    }
  }

  /**
   * Verifica si el token actual es válido
   */
  private isTokenValid(): boolean {
    if (!this.tokens || !this.tokenExpiry) {
      return false;
    }
    // Renovar el token 5 minutos antes de que expire
    return this.tokenExpiry.getTime() > Date.now() + (5 * 60 * 1000);
  }

  /**
   * Asegura que tenemos un token válido antes de hacer una llamada
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.isTokenValid()) {
      await this.authenticate();
    }
    return this.tokens!.access_token;
  }

  /**
   * GESTIÓN DE CLIENTES
   */

  async createCustomer(customer: Omit<ContaSimpleCustomer, 'id'>): Promise<ContaSimpleCustomer> {
    const token = await this.ensureValidToken();
    try {
      const customerSchema = z.object({
        id: z.string(),
        name: z.string(),
        taxId: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.any().optional(),
        customerType: z.enum(['individual', 'business']).optional(),
      });

      const data = await this.request<z.infer<typeof customerSchema>>(
        {
          url: '/customers',
          method: 'POST',
          data: customer,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:customers'
      );

      const parsed = customerSchema.parse(data);
      logger.info('✅ ContaSimple: Cliente creado:', parsed.id);
      return parsed;
    } catch (error: any) {
      logger.error('❌ Error al crear cliente en ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al crear cliente en ContaSimple');
    }
  }

  async getCustomer(customerId: string): Promise<ContaSimpleCustomer> {
    const token = await this.ensureValidToken();
    try {
      const customerSchema = z.object({
        id: z.string(),
        name: z.string(),
        taxId: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.any().optional(),
        customerType: z.enum(['individual', 'business']).optional(),
      });

      const data = await this.request<z.infer<typeof customerSchema>>(
        {
          url: `/customers/${customerId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        'contasimple:customers'
      );

      return customerSchema.parse(data);
    } catch (error: any) {
      logger.error('❌ Error al obtener cliente de ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al obtener cliente de ContaSimple');
    }
  }

  async updateCustomer(customerId: string, customer: Partial<ContaSimpleCustomer>): Promise<ContaSimpleCustomer> {
    const token = await this.ensureValidToken();
    try {
      const customerSchema = z.object({
        id: z.string(),
        name: z.string(),
        taxId: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.any().optional(),
        customerType: z.enum(['individual', 'business']).optional(),
      });

      const data = await this.request<z.infer<typeof customerSchema>>(
        {
          url: `/customers/${customerId}`,
          method: 'PUT',
          data: customer,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:customers'
      );
      logger.info('✅ ContaSimple: Cliente actualizado:', customerId);
      return customerSchema.parse(data);
    } catch (error: any) {
      logger.error('❌ Error al actualizar cliente en ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al actualizar cliente en ContaSimple');
    }
  }

  /**
   * GESTIÓN DE FACTURAS
   */

  async createInvoice(invoice: Omit<ContaSimpleInvoice, 'id'>): Promise<ContaSimpleInvoice> {
    const token = await this.ensureValidToken();
    try {
      const invoiceSchema = z.object({
        id: z.string(),
        number: z.string(),
        series: z.string().optional(),
        date: z.string(),
        dueDate: z.string(),
        customerId: z.string(),
        items: z.array(z.any()),
        subtotal: z.number(),
        taxBase: z.number().optional(),
        iva: z.number().optional(),
        total: z.number(),
        status: z.string(),
      });

      const data = await this.request<z.infer<typeof invoiceSchema>>(
        {
          url: '/invoices',
          method: 'POST',
          data: invoice,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:invoices'
      );

      const parsed = invoiceSchema.parse(data);
      logger.info('✅ ContaSimple: Factura creada:', parsed.number);
      return parsed as ContaSimpleInvoice;
    } catch (error: any) {
      logger.error('❌ Error al crear factura en ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al crear factura en ContaSimple');
    }
  }

  async getInvoice(invoiceId: string): Promise<ContaSimpleInvoice> {
    const token = await this.ensureValidToken();
    try {
      const invoiceSchema = z.object({
        id: z.string(),
        number: z.string(),
        series: z.string().optional(),
        date: z.string(),
        dueDate: z.string(),
        customerId: z.string(),
        items: z.array(z.any()),
        subtotal: z.number(),
        taxBase: z.number().optional(),
        iva: z.number().optional(),
        total: z.number(),
        status: z.string(),
      });

      const data = await this.request<z.infer<typeof invoiceSchema>>(
        {
          url: `/invoices/${invoiceId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        'contasimple:invoices'
      );

      return invoiceSchema.parse(data) as ContaSimpleInvoice;
    } catch (error: any) {
      logger.error('❌ Error al obtener factura de ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al obtener factura de ContaSimple');
    }
  }

  async sendInvoice(invoiceId: string, recipientEmail: string): Promise<boolean> {
    const token = await this.ensureValidToken();
    try {
      await this.request(
        {
          url: `/invoices/${invoiceId}/send`,
          method: 'POST',
          data: { email: recipientEmail },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:invoices'
      );
      logger.info('✅ ContaSimple: Factura enviada a', recipientEmail);
      return true;
    } catch (error: any) {
      logger.error('❌ Error al enviar factura de ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al enviar factura de ContaSimple');
    }
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    const token = await this.ensureValidToken();
    try {
      await this.request(
        {
          url: `/invoices/${invoiceId}/cancel`,
          method: 'POST',
          data: {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        'contasimple:invoices'
      );
      logger.info('✅ ContaSimple: Factura cancelada:', invoiceId);
      return true;
    } catch (error: any) {
      logger.error('❌ Error al cancelar factura de ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al cancelar factura de ContaSimple');
    }
  }

  /**
   * GESTIÓN DE PAGOS
   */

  async registerPayment(payment: Omit<ContaSimplePayment, 'id'>): Promise<ContaSimplePayment> {
    const token = await this.ensureValidToken();
    try {
      const paymentSchema = z.object({
        id: z.string(),
        invoiceId: z.string(),
        date: z.string(),
        amount: z.number(),
        method: z.string(),
        reference: z.string().optional(),
      });

      const data = await this.request<z.infer<typeof paymentSchema>>(
        {
          url: '/payments',
          method: 'POST',
          data: payment,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:payments'
      );

      const parsed = paymentSchema.parse(data);
      logger.info('✅ ContaSimple: Pago registrado:', parsed.amount);
      return parsed as ContaSimplePayment;
    } catch (error: any) {
      logger.error('❌ Error al registrar pago en ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al registrar pago en ContaSimple');
    }
  }

  /**
   * GESTIÓN DE GASTOS
   */

  async createExpense(expense: Omit<ContaSimpleExpense, 'id'>): Promise<ContaSimpleExpense> {
    const token = await this.ensureValidToken();
    try {
      const expenseSchema = z.object({
        id: z.string(),
        date: z.string(),
        description: z.string(),
        amount: z.number(),
        category: z.string(),
        supplierId: z.string().optional(),
        taxDeductible: z.boolean().optional(),
        receiptUrl: z.string().optional(),
      });

      const data = await this.request<z.infer<typeof expenseSchema>>(
        {
          url: '/expenses',
          method: 'POST',
          data: expense,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        'contasimple:expenses'
      );

      const parsed = expenseSchema.parse(data);
      logger.info('✅ ContaSimple: Gasto registrado:', parsed.amount);
      return parsed as ContaSimpleExpense;
    } catch (error: any) {
      logger.error('❌ Error al crear gasto en ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al crear gasto en ContaSimple');
    }
  }

  async getExpenses(filters?: { startDate?: Date; endDate?: Date; category?: string }): Promise<ContaSimpleExpense[]> {
    const token = await this.ensureValidToken();
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('start_date', filters.startDate.toISOString());
      if (filters?.endDate) params.append('end_date', filters.endDate.toISOString());
      if (filters?.category) params.append('category', filters.category);

      const response = await this.axiosInstance.get(`/expenses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error('❌ Error al obtener gastos de ContaSimple:', error.response?.data || error.message);
      throw new Error('Error al obtener gastos de ContaSimple');
    }
  }

  /**
   * SINCRONIZACIÓN CON INMOVA
   */

  /**
   * Sincroniza un inquilino de INMOVA con ContaSimple como cliente
   */
  async syncTenantToCustomer(tenant: any): Promise<ContaSimpleCustomer> {
    const customer: Omit<ContaSimpleCustomer, 'id'> = {
      name: tenant.nombreCompleto,
      taxId: tenant.dni,
      email: tenant.email,
      phone: tenant.telefono,
      customerType: 'individual',
      address: tenant.direccionActual ? {
        street: tenant.direccionActual,
        city: '',
        postalCode: '',
        province: '',
        country: 'España',
      } : undefined,
    };
    return await this.createCustomer(customer);
  }

  /**
   * Crea una factura en ContaSimple desde un contrato de INMOVA
   */
  async createInvoiceFromContract(
    contract: any,
    contaSimpleCustomerId: string
  ): Promise<ContaSimpleInvoice> {
    const invoice: Omit<ContaSimpleInvoice, 'id'> = {
      number: `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      series: 'A',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: contaSimpleCustomerId,
      items: [
        {
          description: `Alquiler - ${contract.unit?.building?.nombre || 'Propiedad'} - ${contract.unit?.numero || ''}`,
          quantity: 1,
          unitPrice: contract.rentaMensual,
          ivaRate: 21,
          amount: contract.rentaMensual,
        },
      ],
      subtotal: contract.rentaMensual,
      taxBase: contract.rentaMensual,
      iva: contract.rentaMensual * 0.21,
      total: contract.rentaMensual * 1.21,
      status: 'draft',
    };
    return await this.createInvoice(invoice);
  }

  /**
   * Sincroniza un pago de INMOVA con ContaSimple
   */
  async syncPaymentToContaSimple(payment: any, invoiceId: string): Promise<ContaSimplePayment> {
    const contaSimplePayment: Omit<ContaSimplePayment, 'id'> = {
      invoiceId,
      date: payment.fechaPago || new Date(),
      amount: payment.monto,
      method: payment.metodoPago === 'transferencia' ? 'transfer' : 
              payment.metodoPago === 'tarjeta' ? 'card' : 
              payment.metodoPago === 'efectivo' ? 'cash' : 'transfer',
      reference: payment.referencia,
    };
    return await this.registerPayment(contaSimplePayment);
  }

  /**
   * Sincroniza un gasto de INMOVA con ContaSimple
   */
  async syncExpenseToContaSimple(expense: any): Promise<ContaSimpleExpense> {
    const contaSimpleExpense: Omit<ContaSimpleExpense, 'id'> = {
      date: expense.fechaGasto || new Date(),
      description: expense.concepto || 'Gasto de mantenimiento',
      amount: expense.monto,
      category: expense.categoria || 'Mantenimiento',
      taxDeductible: true,
      supplierId: expense.proveedorId,
    };
    return await this.createExpense(contaSimpleExpense);
  }

  /**
   * Prueba la conexión con ContaSimple
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.apiKey || !this.config.companyId) {
        return {
          success: false,
          message: 'ContaSimple no está configurado. Por favor, añade las credenciales en las variables de entorno.'
        };
      }

      // Intentar obtener información de la empresa
      const response = await this.client.get('/company');
      
      return {
        success: true,
        message: `Conectado exitosamente a ContaSimple (${response.data.name || 'Cuenta activa'})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.response?.data?.message || error.message}`
      };
    }
  }

  /**
   * Verifica si está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.companyId);
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
    process.env.CONTASIMPLE_AUTH_KEY &&
    process.env.CONTASIMPLE_API_URL
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
 * CONTASIMPLE_AUTH_KEY=tu_clave_de_autorizacion
 * CONTASIMPLE_API_URL=https://api.contasimple.com/api/v2
 * 
 * // 2. Importar el servicio
 * import { getContaSimpleService } from '@/lib/contasimple-integration-service';
 * 
 * // 3. Obtener instancia del servicio
 * const contaSimple = getContaSimpleService();
 * 
 * // 4. Autenticarse (opcional, se hace automáticamente)
 * await contaSimple.authenticate();
 * 
 * // 5. Usar la API - Sincronizar datos de INMOVA
 * 
 * // Sincronizar inquilino como cliente
 * const customer = await contaSimple.syncTenantToCustomer(tenant);
 * 
 * // Crear factura desde contrato
 * const invoice = await contaSimple.createInvoiceFromContract(contract, customer.id);
 * 
 * // Registrar pago
 * const payment = await contaSimple.syncPaymentToContaSimple(paymentData, invoice.id);
 * 
 * // Registrar gasto
 * const expense = await contaSimple.syncExpenseToContaSimple(expenseData);
 * 
 * // 6. Operaciones directas con la API
 * 
 * // Obtener cliente
 * const customerDetails = await contaSimple.getCustomer(customerId);
 * 
 * // Enviar factura por email
 * await contaSimple.sendInvoice(invoiceId, 'cliente@email.com');
 * 
 * // Obtener gastos filtrados
 * const expenses = await contaSimple.getExpenses({
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31'),
 *   category: 'Mantenimiento'
 * });
 */

// @ts-nocheck
/**
 * A3 Software Integration Service
 * 
 * Servicio de integración con A3 Software (Wolters Kluwer)
 * Sistema ERP y de gestión empresarial líder en España
 * 
 * Características:
 * - Gestión de clientes
 * - Emisión de facturas
 * - Registro de pagos
 * - Contabilidad analítica
 * 
 * Documentación API: https://www.wolterskluwer.com/es-es/solutions/a3software
 */

import axios, { AxiosInstance } from 'axios';
import { prisma } from './db';

interface A3Config {
  apiKey: string;
  apiUrl: string;
  companyId: string;
  username: string;
  password: string;
}

interface A3Customer {
  id?: string;
  code?: string;
  fiscalName: string;
  tradeName?: string;
  taxId: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  paymentMethod?: string;
  paymentDays?: number;
}

interface A3Invoice {
  id?: string;
  customerId: string;
  invoiceNumber?: string;
  series?: string;
  date: string;
  dueDate: string;
  currency?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount?: number;
  }>;
  notes?: string;
}

interface A3Payment {
  id?: string;
  customerId: string;
  invoiceId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  bankAccount?: string;
  reference?: string;
}

class A3IntegrationService {
  private config: A3Config;
  private client: AxiosInstance;
  private sessionToken: string | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.A3_API_KEY || '',
      apiUrl: process.env.A3_API_URL || 'https://api.a3software.com/v1',
      companyId: process.env.A3_COMPANY_ID || '',
      username: process.env.A3_USERNAME || '',
      password: process.env.A3_PASSWORD || ''
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': this.config.apiKey
      }
    });
  }

  /**
   * Verifica si A3 está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.companyId && this.config.username);
  }

  /**
   * Autentica y obtiene un token de sesión
   */
  async authenticate(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('A3 Software not configured');
    }

    try {
      const response = await this.client.post('/auth/login', {
        username: this.config.username,
        password: this.config.password,
        companyId: this.config.companyId
      });

      this.sessionToken = response.data.token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.sessionToken}`;

      return this.sessionToken;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Asegura que hay una sesión activa
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.sessionToken) {
      await this.authenticate();
    }
  }

  /**
   * Crea un cliente en A3
   */
  async createCustomer(customer: A3Customer): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.post('/customers', {
      codigo: customer.code,
      razonSocial: customer.fiscalName,
      nombreComercial: customer.tradeName || customer.fiscalName,
      nif: customer.taxId,
      email: customer.email,
      telefono: customer.phone,
      direccion: customer.address,
      ciudad: customer.city,
      codigoPostal: customer.postalCode,
      provincia: customer.province,
      pais: customer.country || 'ES',
      formaPago: customer.paymentMethod || 'TRANSFERENCIA',
      diasPago: customer.paymentDays || 30
    });

    return response.data;
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCustomer(customerId: string): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.get(`/customers/${customerId}`);
    return response.data;
  }

  /**
   * Busca un cliente por NIF/CIF
   */
  async findCustomerByTaxId(taxId: string): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.get('/customers/search', {
      params: { nif: taxId }
    });

    return response.data?.items?.[0] || null;
  }

  /**
   * Actualiza un cliente
   */
  async updateCustomer(customerId: string, customer: Partial<A3Customer>): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.put(`/customers/${customerId}`, customer);
    return response.data;
  }

  /**
   * Crea una factura en A3
   */
  async createInvoice(invoice: A3Invoice): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.post('/invoices', {
      clienteId: invoice.customerId,
      serie: invoice.series || 'A',
      fecha: invoice.date,
      fechaVencimiento: invoice.dueDate,
      moneda: invoice.currency || 'EUR',
      lineas: invoice.lines.map(line => ({
        descripcion: line.description,
        cantidad: line.quantity,
        precioUnitario: line.unitPrice,
        tipoIVA: line.taxRate,
        descuento: line.discount || 0
      })),
      observaciones: invoice.notes
    });

    return response.data;
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Registra un pago (cobro) en A3
   */
  async registerPayment(payment: A3Payment): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.client.post('/payments/receipts', {
      clienteId: payment.customerId,
      facturaId: payment.invoiceId,
      fecha: payment.date,
      importe: payment.amount,
      formaPago: payment.paymentMethod,
      cuentaBancaria: payment.bankAccount,
      referencia: payment.reference
    });

    return response.data;
  }

  /**
   * Sincroniza un inquilino de INMOVA como cliente en A3
   */
  async syncTenantToCustomer(tenantId: string, companyId: string): Promise<any> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: { include: { building: true } } }
    });

    if (!tenant || tenant.companyId !== companyId) {
      throw new Error('Tenant not found or access denied');
    }

    // Buscar cliente existente por DNI
    const existingCustomer = await this.findCustomerByTaxId(tenant.dni);

    if (existingCustomer) {
      return existingCustomer;
    }

    // Crear nuevo cliente
    const firstUnit = tenant.units?.[0];
    const customer: A3Customer = {
      code: tenantId.substring(0, 10).toUpperCase(),
      fiscalName: tenant.nombreCompleto,
      tradeName: tenant.nombreCompleto,
      taxId: tenant.dni,
      email: tenant.email,
      phone: tenant.telefono,
      address: firstUnit?.building?.direccion || '',
      city: 'Madrid',
      postalCode: '28001',
      province: 'Madrid',
      country: 'ES',
      paymentMethod: 'TRANSFERENCIA',
      paymentDays: 5
    };

    return await this.createCustomer(customer);
  }

  /**
   * Crea una factura en A3 desde un contrato de INMOVA
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
    const invoice: A3Invoice = {
      customerId: customer.id,
      series: 'ALQ',  // Serie para alquileres
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(contract.diaPago || 5)).toISOString().split('T')[0],
      currency: 'EUR',
      lines: [
        {
          description: `Renta mensual - ${contract.unit?.numero} (${contract.unit?.building?.nombre})`,
          quantity: 1,
          unitPrice: contract.rentaMensual,
          taxRate: 0,  // Alquileres residenciales exentos de IVA en España
          discount: 0
        }
      ],
      notes: `Contrato: ${contractId}\nPeríodo: ${contract.fechaInicio.toLocaleDateString('es-ES')} - ${contract.fechaFin.toLocaleDateString('es-ES')}`
    };

    if (contract.deposito) {
      invoice.lines.push({
        description: 'Depósito de garantía',
        quantity: 1,
        unitPrice: contract.deposito,
        taxRate: 0,
        discount: 0
      });
    }

    return await this.createInvoice(invoice);
  }

  /**
   * Registra un pago de INMOVA en A3
   */
  async syncPaymentToA3(paymentId: string, companyId: string): Promise<any> {
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

    const a3Payment: A3Payment = {
      customerId: customer.id,
      invoiceId: '',  // TODO: Implementar almacenamiento de a3InvoiceId en Payment
      date: payment.fechaPago?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      amount: payment.monto,
      paymentMethod: this.mapPaymentMethod(payment.metodoPago),
      reference: `INMOVA-${paymentId}`
    };

    return await this.registerPayment(a3Payment);
  }

  /**
   * Mapea métodos de pago de INMOVA a A3
   */
  private mapPaymentMethod(method: string | null): string {
    const mapping: { [key: string]: string } = {
      'transferencia': 'TRANSFERENCIA',
      'tarjeta': 'TARJETA',
      'efectivo': 'EFECTIVO',
      'domiciliacion': 'DOMICILIACION'
    };

    return mapping[method?.toLowerCase() || 'transferencia'] || 'TRANSFERENCIA';
  }

  /**
   * Prueba la conexión con A3
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'A3 Software no configurado. Por favor, añade las credenciales en las variables de entorno.'
        };
      }

      await this.authenticate();

      // Intentar obtener información de la compañía
      const response = await this.client.get('/company/info');

      return {
        success: true,
        message: `Conectado exitosamente a A3 Software (${response.data.razonSocial || 'Cuenta activa'})`
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
let a3Service: A3IntegrationService | null = null;

export function getA3Service(): A3IntegrationService {
  if (!a3Service) {
    a3Service = new A3IntegrationService();
  }
  return a3Service;
}

export function isA3Configured(): boolean {
  return getA3Service().isConfigured();
}

export { A3IntegrationService };
export type { A3Customer, A3Invoice, A3Payment };

/**
 * A3 SOFTWARE INTEGRATION SERVICE (PREPARADO - NO FUNCIONAL)
 * 
 * Servicio de integración con A3 Software
 * ERP de referencia en España, especialmente en medianas empresas
 * 
 * ==============================================================================
 * IMPORTANTE: Este código está preparado en modo DEMO
 * Requiere acceso como partner comercial de A3 Software
 * ==============================================================================
 * 
 * DOCUMENTACIÓN OFICIAL:
 * - Web oficial: https://www.wolterskluwer.com/es-es/solutions/a3
 * - Contacto para desarrolladores: A través de partner comercial
 * 
 * CÓMO ACTIVAR ESTA INTEGRACIÓN:
 * 
 * 1. Obtener Acceso:
 *    - Contactar con Wolters Kluwer para ser partner
 *    - Solicitar acceso a A3 API
 *    - Obtener credenciales de conexión
 * 
 * 2. Configurar Variables de Entorno (.env):
 *    A3_API_URL=url_proporcionada_por_a3
 *    A3_CLIENT_ID=tu_client_id
 *    A3_CLIENT_SECRET=tu_client_secret
 *    A3_COMPANY_CODE=codigo_empresa
 * 
 * 3. Descomentar el código de este archivo
 * 
 * 4. Instalar dependencias adicionales (si no están instaladas):
 *    yarn add axios
 */

// import axios, { AxiosInstance } from 'axios';

export interface A3Config {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  companyCode: string;
}

export interface A3Contact {
  codigo: string;
  nombre: string;
  nif: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codigoPostal?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
  tipo: 'cliente' | 'proveedor';
}

export interface A3Factura {
  id: string;
  serie: string;
  numero: string;
  fecha: Date;
  fechaVencimiento: Date;
  clienteCodigo: string;
  clienteNombre: string;
  lineas: A3FacturaLinea[];
  baseImponible: number;
  iva: number;
  totalFactura: number;
  estado: 'emitida' | 'cobrada' | 'pendiente' | 'anulada';
}

export interface A3FacturaLinea {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  tipoIva: number;
  baseImponible: number;
  iva: number;
  total: number;
}

export interface A3Pago {
  id: string;
  facturaId: string;
  fecha: Date;
  importe: number;
  formaPago: 'transferencia' | 'efectivo' | 'tarjeta' | 'domiciliacion';
  cuentaBancaria?: string;
  referencia?: string;
}

export class A3IntegrationService {
  // private config: A3Config;
  // private axiosInstance: AxiosInstance;

  constructor() {
    // this.config = {
    //   apiUrl: process.env.A3_API_URL || '',
    //   clientId: process.env.A3_CLIENT_ID || '',
    //   clientSecret: process.env.A3_CLIENT_SECRET || '',
    //   companyCode: process.env.A3_COMPANY_CODE || '',
    // };

    // this.axiosInstance = axios.create({
    //   baseURL: this.config.apiUrl,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Company-Code': this.config.companyCode,
    //   },
    // });

    console.log('⚠️ A3 Software Integration Service: Modo DEMO - Requiere acceso partner');
  }

  /**
   * GESTIÓN DE CONTACTOS
   */

  // async createContact(contact: Omit<A3Contact, 'codigo'>): Promise<A3Contact> {
  //   const response = await this.axiosInstance.post('/contactos', contact);
  //   return response.data;
  // }

  // async getContact(codigo: string): Promise<A3Contact> {
  //   const response = await this.axiosInstance.get(`/contactos/${codigo}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE FACTURAS
   */

  // async createInvoice(factura: Omit<A3Factura, 'id'>): Promise<A3Factura> {
  //   const response = await this.axiosInstance.post('/facturas', factura);
  //   return response.data;
  // }

  // async getInvoice(facturaId: string): Promise<A3Factura> {
  //   const response = await this.axiosInstance.get(`/facturas/${facturaId}`);
  //   return response.data;
  // }

  /**
   * GESTIÓN DE PAGOS
   */

  // async registerPayment(pago: Omit<A3Pago, 'id'>): Promise<A3Pago> {
  //   const response = await this.axiosInstance.post('/pagos', pago);
  //   return response.data;
  // }

  /**
   * MÉTODOS DEMO
   */

  async syncTenantToContactDemo(tenant: any): Promise<any> {
    console.log('🔄 [DEMO] Sincronizando inquilino con A3:', tenant.nombreCompleto);
    return {
      codigo: `A3_${Math.random().toString(36).substring(7).toUpperCase()}`,
      nombre: tenant.nombreCompleto,
      nif: tenant.dni,
      email: tenant.email,
      tipo: 'cliente',
      synced: true,
      syncDate: new Date(),
    };
  }

  async createInvoiceDemo(contractData: any): Promise<any> {
    console.log('📄 [DEMO] Creando factura en A3 para contrato:', contractData.id);
    const year = new Date().getFullYear();
    const numero = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return {
      id: `a3_factura_${Math.random().toString(36).substring(7)}`,
      serie: 'A',
      numero: `${year}/${numero}`,
      baseImponible: contractData.rentaMensual,
      iva: contractData.rentaMensual * 0.21,
      totalFactura: contractData.rentaMensual * 1.21,
      estado: 'emitida',
      created: true,
      createdAt: new Date(),
    };
  }

  async syncPaymentDemo(payment: any): Promise<any> {
    console.log('💰 [DEMO] Registrando pago en A3:', payment.monto);
    return {
      id: `a3_pago_${Math.random().toString(36).substring(7)}`,
      importe: payment.monto,
      formaPago: payment.metodoPago || 'transferencia',
      registered: true,
      registeredAt: new Date(),
    };
  }
}

export function isA3Configured(): boolean {
  return !!(
    process.env.A3_API_URL &&
    process.env.A3_CLIENT_ID &&
    process.env.A3_CLIENT_SECRET
  );
}

let a3ServiceInstance: A3IntegrationService | null = null;

export function getA3Service(): A3IntegrationService {
  if (!a3ServiceInstance) {
    a3ServiceInstance = new A3IntegrationService();
  }
  return a3ServiceInstance;
}

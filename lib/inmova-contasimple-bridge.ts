/**
 * Puente Inmova ↔ Contasimple
 * 
 * Gestiona la facturación B2B de Inmova a sus clientes usando Contasimple
 * 
 * Features:
 * 1. Inmova emite facturas oficiales en Contasimple cuando cobra a clientes
 * 2. Sincroniza B2BInvoice con Contasimple
 * 3. Registra pagos de Stripe en Contasimple
 * 4. Mantiene contabilidad oficial de ingresos B2B
 */

import {
  ContaSimpleIntegrationService,
  type ContaSimpleCustomer,
  type ContaSimpleInvoice,
  type ContaSimpleInvoiceItem,
  type ContaSimplePayment,
} from './contasimple-integration-service';
import logger from './logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

let contasimpleConfigLogged = false;
let contasimpleConfiguredLogged = false;
// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Credenciales de Contasimple para la cuenta de INMOVA
 * (diferentes a las credenciales de los clientes)
 */
const INMOVA_CONTASIMPLE_CONFIG = {
  authKey: process.env.INMOVA_CONTASIMPLE_AUTH_KEY || '',
  apiUrl: process.env.CONTASIMPLE_API_URL || 'https://api.contasimple.com/api/v2',
};

/**
 * Datos fiscales de Inmova para las facturas
 */
const INMOVA_FISCAL_DATA = {
  nombre: 'INMOVA PROPTECH SL',
  cif: process.env.INMOVA_CIF || 'B12345678',
  direccion: process.env.INMOVA_DIRECCION || 'Calle Principal 123',
  ciudad: process.env.INMOVA_CIUDAD || 'Madrid',
  codigoPostal: process.env.INMOVA_CP || '28001',
  pais: 'España',
  email: process.env.INMOVA_EMAIL || 'facturacion@inmova.app',
  telefono: process.env.INMOVA_TELEFONO || '+34 912 345 678',
};

// IVA español estándar
const IVA_RATE = 21;

// ═══════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export class InmovaContasimpleBridge {
  private contasimple: ContaSimpleIntegrationService;

  constructor() {
    // Usar servicio de Contasimple con credenciales de Inmova
    this.contasimple = new ContaSimpleIntegrationService();
    
    if (!INMOVA_CONTASIMPLE_CONFIG.authKey) {
      if (!contasimpleConfigLogged) {
        logger.warn('[Inmova-Contasimple] ⚠️ No hay credenciales de Contasimple configuradas para Inmova');
        contasimpleConfigLogged = true;
      }
    } else {
      if (!contasimpleConfiguredLogged) {
        logger.info('[Inmova-Contasimple] ✅ Servicio inicializado');
        contasimpleConfiguredLogged = true;
      }
    }
  }

  /**
   * Verifica si Contasimple está configurado para Inmova
   */
  isConfigured(): boolean {
    return !!INMOVA_CONTASIMPLE_CONFIG.authKey;
  }

  /**
   * Sincroniza una factura B2B de Inmova con Contasimple
   * 
   * @param b2bInvoiceId - ID de la factura en la tabla B2BInvoice
   * @returns ID de la factura en Contasimple
   */
  async syncB2BInvoiceToContasimple(b2bInvoiceId: string): Promise<string | null> {
    if (!this.isConfigured()) {
      logger.warn('[Inmova-Contasimple] Sincronización omitida: no hay credenciales');
      return null;
    }

    try {
      const prisma = await getPrisma();
      // 1. Obtener factura de BD
      const b2bInvoice = await prisma.b2BInvoice.findUnique({
        where: { id: b2bInvoiceId },
        include: {
          company: true,
          subscriptionPlan: true,
        },
      });

      if (!b2bInvoice) {
        throw new Error(`B2BInvoice ${b2bInvoiceId} not found`);
      }

      // Si ya tiene ID de Contasimple, no duplicar
      if (b2bInvoice.contasimpleInvoiceId) {
        logger.info(`[Inmova-Contasimple] Factura ${b2bInvoice.numeroFactura} ya sincronizada`);
        return b2bInvoice.contasimpleInvoiceId;
      }

      logger.info(`[Inmova-Contasimple] Sincronizando factura ${b2bInvoice.numeroFactura}...`);

      // 2. Crear/obtener cliente en Contasimple
      const customerId = await this.ensureCustomerExists(b2bInvoice.company);

      // 3. Preparar items de la factura
      const items = this.prepareInvoiceItems(b2bInvoice);

      // 4. Crear factura en Contasimple
      const contasimpleInvoice = await this.contasimple.createInvoice({
        number: b2bInvoice.numeroFactura,
        series: 'INV', // Serie de facturas de Inmova
        date: b2bInvoice.fechaEmision,
        dueDate: b2bInvoice.fechaVencimiento,
        customerId,
        items,
        subtotal: b2bInvoice.subtotal,
        taxBase: b2bInvoice.subtotal - b2bInvoice.descuento,
        iva: b2bInvoice.impuestos,
        total: b2bInvoice.total,
        status: this.mapB2BStatusToContasimple(b2bInvoice.estado),
        paymentMethod: this.mapPaymentMethod(b2bInvoice.metodoPago),
      });

      await prisma.b2BInvoice.update({
        where: { id: b2bInvoiceId },
        data: {
          contasimpleInvoiceId: contasimpleInvoice.id,
        },
      });

      logger.info(`[Inmova-Contasimple] ✅ Factura ${b2bInvoice.numeroFactura} sincronizada en Contasimple`);

      // 6. Enviar factura por email al cliente
      if (b2bInvoice.company.email || b2bInvoice.company.emailContacto) {
        const email = b2bInvoice.company.emailContacto || b2bInvoice.company.email;
        await this.contasimple.sendInvoice(contasimpleInvoice.id, email!);
        logger.info(`[Inmova-Contasimple] ✅ Factura enviada por email a ${email}`);
      }

      return contasimpleInvoice.id;
    } catch (error: any) {
      logger.error('[Inmova-Contasimple] Error sincronizando factura:', error);
      throw error;
    }
  }

  /**
   * Registra un pago de Stripe en Contasimple
   * 
   * @param b2bInvoiceId - ID de la factura B2B
   * @param paymentData - Datos del pago de Stripe
   */
  async syncPaymentToContasimple(
    b2bInvoiceId: string,
    paymentData: {
      amount: number;
      date: Date;
      stripePaymentIntentId: string;
      method: 'card' | 'transfer' | 'direct_debit';
    }
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      logger.warn('[Inmova-Contasimple] Sincronización de pago omitida: no hay credenciales');
      return null;
    }

    try {
      const prisma = await getPrisma();
      const b2bInvoice = await prisma.b2BInvoice.findUnique({
        where: { id: b2bInvoiceId },
      });

      if (!b2bInvoice || !b2bInvoice.contasimpleInvoiceId) {
        logger.warn(`[Inmova-Contasimple] Factura ${b2bInvoiceId} no tiene ID de Contasimple, sincronizando primero...`);
        await this.syncB2BInvoiceToContasimple(b2bInvoiceId);
        
        const updated = await prisma.b2BInvoice.findUnique({ where: { id: b2bInvoiceId } });
        if (!updated?.contasimpleInvoiceId) {
          throw new Error('No se pudo sincronizar factura con Contasimple');
        }
        b2bInvoice.contasimpleInvoiceId = updated.contasimpleInvoiceId;
      }

      logger.info(`[Inmova-Contasimple] Registrando pago para factura ${b2bInvoice.numeroFactura}...`);

      const payment = await this.contasimple.registerPayment({
        invoiceId: b2bInvoice.contasimpleInvoiceId,
        date: paymentData.date,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: `Stripe: ${paymentData.stripePaymentIntentId}`,
      });

      await prisma.b2BInvoice.update({
        where: { id: b2bInvoiceId },
        data: {
          estado: 'PAGADA',
          fechaPago: paymentData.date,
          metodoPago: paymentData.method,
        },
      });

      logger.info(`[Inmova-Contasimple] ✅ Pago registrado en Contasimple: €${paymentData.amount}`);

      return payment.id;
    } catch (error: any) {
      logger.error('[Inmova-Contasimple] Error registrando pago:', error);
      throw error;
    }
  }

  /**
   * Sincroniza todas las facturas B2B pendientes de un período
   */
  async syncPendingInvoices(startDate: Date, endDate: Date): Promise<{
    synced: number;
    errors: number;
  }> {
    const prisma = await getPrisma();
    const invoices = await prisma.b2BInvoice.findMany({
      where: {
        fechaEmision: {
          gte: startDate,
          lte: endDate,
        },
        contasimpleInvoiceId: null, // Solo las que NO están sincronizadas
      },
    });

    let synced = 0;
    let errors = 0;

    for (const invoice of invoices) {
      try {
        await this.syncB2BInvoiceToContasimple(invoice.id);
        synced++;
      } catch (error) {
        logger.error(`[Inmova-Contasimple] Error sincronizando ${invoice.numeroFactura}:`, error);
        errors++;
      }
    }

    logger.info(`[Inmova-Contasimple] Sincronización masiva completada: ${synced} ok, ${errors} errores`);

    return { synced, errors };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Asegura que el cliente existe en Contasimple
   * Si no existe, lo crea. Si existe, lo actualiza.
   */
  private async ensureCustomerExists(company: any): Promise<string> {
    // Verificar si ya tiene ID de Contasimple guardado en BD
    if (company.contasimpleCustomerId) {
      return company.contasimpleCustomerId;
    }

    // Crear cliente en Contasimple
    const customer = await this.contasimple.createCustomer({
      name: company.nombre,
      taxId: company.cif || 'NO-CIF',
      email: company.emailContacto || company.email,
      phone: company.telefonoContacto || company.telefono,
      address: {
        street: company.direccion || 'Sin dirección',
        city: company.ciudad || 'Sin ciudad',
        postalCode: company.codigoPostal || '00000',
        province: company.provincia || 'Sin provincia',
        country: company.pais || 'España',
      },
      customerType: 'business',
    });

    const prisma = await getPrisma();
    await prisma.company.update({
      where: { id: company.id },
      data: {
        contasimpleCustomerId: customer.id,
      },
    });

    logger.info(`[Inmova-Contasimple] ✅ Cliente creado en Contasimple: ${customer.name}`);

    return customer.id;
  }

  /**
   * Prepara los items de la factura para Contasimple
   */
  private prepareInvoiceItems(b2bInvoice: any): ContaSimpleInvoiceItem[] {
    const conceptos = b2bInvoice.conceptos as any[];

    return conceptos.map((concepto) => ({
      description: concepto.descripcion || concepto.description || 'Servicio',
      quantity: concepto.cantidad || concepto.quantity || 1,
      unitPrice: concepto.precioUnitario || concepto.unitPrice || 0,
      ivaRate: IVA_RATE,
      amount: concepto.total || concepto.amount || 0,
    }));
  }

  /**
   * Mapea el estado de B2BInvoice a estado de Contasimple
   */
  private mapB2BStatusToContasimple(
    estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIALMENTE_PAGADA'
  ): 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' {
    const map: Record<string, 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'> = {
      PENDIENTE: 'sent',
      PAGADA: 'paid',
      VENCIDA: 'overdue',
      CANCELADA: 'cancelled',
      PARCIALMENTE_PAGADA: 'sent',
    };

    return map[estado] || 'sent';
  }

  /**
   * Mapea método de pago
   */
  private mapPaymentMethod(
    metodoPago: string | null
  ): 'transfer' | 'card' | 'cash' | 'direct_debit' | undefined {
    if (!metodoPago) return undefined;

    const map: Record<string, 'transfer' | 'card' | 'cash' | 'direct_debit'> = {
      stripe: 'card',
      tarjeta: 'card',
      card: 'card',
      transferencia: 'transfer',
      transfer: 'transfer',
      domiciliacion: 'direct_debit',
      direct_debit: 'direct_debit',
      efectivo: 'cash',
      cash: 'cash',
    };

    return map[metodoPago.toLowerCase()];
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let inmovaContasimpleBridgeInstance: InmovaContasimpleBridge | null = null;

export function getInmovaContasimpleBridge(): InmovaContasimpleBridge {
  if (!inmovaContasimpleBridgeInstance) {
    inmovaContasimpleBridgeInstance = new InmovaContasimpleBridge();
  }
  return inmovaContasimpleBridgeInstance;
}

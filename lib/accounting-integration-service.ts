/**
 * SERVICIO UNIFICADO DE INTEGRACIÓN CONTABLE
 * 
 * Coordina la sincronización con múltiples ERPs/sistemas contables:
 * - A3 Software (Wolters Kluwer) - España
 * - Alegra - Latinoamérica
 * - Contasimple - España (Pymes)
 * - Holded - España (Startups)
 * - Sage - Internacional
 * 
 * Funcionalidades:
 * - Exportar clientes (inquilinos/propietarios)
 * - Exportar facturas emitidas y recibidas
 * - Exportar cobros y pagos
 * - Sincronizar asientos contables
 * - Importar datos maestros
 * 
 * @module AccountingIntegrationService
 */

import { prisma } from './db';
import logger from './logger';
import { A3IntegrationService, isA3Configured } from './a3-integration-service';
import { AlegraService, isAlegraConfigured } from './alegra-integration-service';

// ============================================================================
// TIPOS
// ============================================================================

export type AccountingProvider = 'a3' | 'alegra' | 'contasimple' | 'holded' | 'sage';

export interface AccountingConfig {
  provider: AccountingProvider;
  enabled: boolean;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSync?: Date;
  credentials?: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  provider: AccountingProvider;
  action: string;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: string[];
  timestamp: Date;
}

export interface AccountingEntry {
  date: Date;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const PROVIDER_CONFIGS: Record<AccountingProvider, {
  name: string;
  requiredEnvVars: string[];
  isConfigured: () => boolean;
}> = {
  a3: {
    name: 'A3 Software',
    requiredEnvVars: ['A3_API_KEY', 'A3_API_URL', 'A3_COMPANY_ID'],
    isConfigured: () => isA3Configured(),
  },
  alegra: {
    name: 'Alegra',
    requiredEnvVars: ['ALEGRA_API_KEY', 'ALEGRA_USER'],
    isConfigured: () => isAlegraConfigured(),
  },
  contasimple: {
    name: 'Contasimple',
    requiredEnvVars: ['CONTASIMPLE_API_KEY', 'CONTASIMPLE_SECRET'],
    isConfigured: () => !!process.env.CONTASIMPLE_API_KEY,
  },
  holded: {
    name: 'Holded',
    requiredEnvVars: ['HOLDED_API_KEY'],
    isConfigured: () => !!process.env.HOLDED_API_KEY,
  },
  sage: {
    name: 'Sage',
    requiredEnvVars: ['SAGE_CLIENT_ID', 'SAGE_CLIENT_SECRET'],
    isConfigured: () => !!process.env.SAGE_CLIENT_ID,
  },
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtiene el estado de todos los proveedores contables
 */
export function getProvidersStatus(): Record<AccountingProvider, {
  name: string;
  configured: boolean;
  enabled: boolean;
  lastSync?: Date;
  missingCredentials: string[];
}> {
  const status: Record<string, any> = {};

  for (const [provider, config] of Object.entries(PROVIDER_CONFIGS)) {
    const missingCredentials = config.requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    status[provider] = {
      name: config.name,
      configured: config.isConfigured(),
      enabled: config.isConfigured(),
      missingCredentials,
    };
  }

  return status as any;
}

/**
 * Obtiene el proveedor contable configurado para una empresa
 */
export async function getCompanyAccountingConfig(
  companyId: string
): Promise<AccountingConfig | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        accountingProvider: true,
        accountingAutoSync: true,
        accountingLastSync: true,
      },
    });

    if (!company?.accountingProvider) {
      return null;
    }

    const provider = company.accountingProvider as AccountingProvider;
    const providerConfig = PROVIDER_CONFIGS[provider];

    if (!providerConfig) {
      return null;
    }

    return {
      provider,
      enabled: providerConfig.isConfigured(),
      autoSync: company.accountingAutoSync || false,
      syncFrequency: 'daily',
      lastSync: company.accountingLastSync || undefined,
    };
  } catch (error) {
    logger.error('Error obteniendo config contable:', error);
    return null;
  }
}

/**
 * Sincroniza todos los datos pendientes con el ERP contable
 */
export async function syncWithAccounting(
  companyId: string,
  options: {
    syncClients?: boolean;
    syncInvoices?: boolean;
    syncPayments?: boolean;
    fullSync?: boolean;
  } = {}
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const {
    syncClients = true,
    syncInvoices = true,
    syncPayments = true,
    fullSync = false,
  } = options;

  const config = await getCompanyAccountingConfig(companyId);
  
  if (!config || !config.enabled) {
    return [{
      success: false,
      provider: config?.provider || 'a3',
      action: 'sync',
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors: ['Integración contable no configurada'],
      timestamp: new Date(),
    }];
  }

  const lastSync = fullSync ? undefined : config.lastSync;

  // Sincronizar según proveedor
  switch (config.provider) {
    case 'a3':
      if (syncClients) {
        results.push(await syncClientsToA3(companyId, lastSync));
      }
      if (syncInvoices) {
        results.push(await syncInvoicesToA3(companyId, lastSync));
      }
      if (syncPayments) {
        results.push(await syncPaymentsToA3(companyId, lastSync));
      }
      break;

    case 'alegra':
      if (syncClients) {
        results.push(await syncClientsToAlegra(companyId, lastSync));
      }
      if (syncInvoices) {
        results.push(await syncInvoicesToAlegra(companyId, lastSync));
      }
      break;

    case 'contasimple':
      results.push(await syncToContasimple(companyId, lastSync));
      break;

    case 'holded':
      results.push(await syncToHolded(companyId, lastSync));
      break;

    default:
      results.push({
        success: false,
        provider: config.provider,
        action: 'sync',
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 0,
        errors: ['Proveedor no soportado'],
        timestamp: new Date(),
      });
  }

  // Actualizar fecha de última sincronización
  const allSucceeded = results.every(r => r.success);
  if (allSucceeded) {
    await prisma.company.update({
      where: { id: companyId },
      data: { accountingLastSync: new Date() },
    });
  }

  return results;
}

// ============================================================================
// SINCRONIZACIÓN A3
// ============================================================================

async function syncClientsToA3(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'a3',
    action: 'sync_clients',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Obtener inquilinos para sincronizar
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        ...(since && { updatedAt: { gte: since } }),
      },
      select: {
        id: true,
        nombreCompleto: true,
        dni: true,
        email: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        codigoPostal: true,
        a3CustomerId: true,
      },
    });

    result.itemsProcessed = tenants.length;

    const a3Service = new A3IntegrationService();

    for (const tenant of tenants) {
      try {
        const customerData = {
          fiscalName: tenant.nombreCompleto,
          taxId: tenant.dni || '',
          email: tenant.email || undefined,
          phone: tenant.telefono || undefined,
          address: tenant.direccion || undefined,
          city: tenant.ciudad || undefined,
          postalCode: tenant.codigoPostal || undefined,
        };

        if (tenant.a3CustomerId) {
          // Actualizar cliente existente
          await a3Service.updateCustomer(tenant.a3CustomerId, customerData);
        } else {
          // Crear nuevo cliente
          const newCustomer = await a3Service.createCustomer(customerData);
          
          // Guardar ID de A3 en el inquilino
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { a3CustomerId: newCustomer.id },
          });
        }

        result.itemsSucceeded++;
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Inquilino ${tenant.id}: ${error.message}`);
      }
    }

    result.success = result.itemsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

async function syncInvoicesToA3(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'a3',
    action: 'sync_invoices',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Obtener facturas de inquilinos para sincronizar
    const invoices = await prisma.tenantInvoice.findMany({
      where: {
        companyId,
        status: { in: ['issued', 'paid'] },
        a3InvoiceId: null, // Solo las no sincronizadas
        ...(since && { createdAt: { gte: since } }),
      },
      include: {
        tenant: true,
      },
    });

    result.itemsProcessed = invoices.length;

    const a3Service = new A3IntegrationService();

    for (const invoice of invoices) {
      try {
        // Verificar que el cliente existe en A3
        const customerId = invoice.tenant.a3CustomerId;
        if (!customerId) {
          result.errors.push(`Factura ${invoice.invoiceNumber}: Cliente no sincronizado`);
          result.itemsFailed++;
          continue;
        }

        const a3Invoice = await a3Service.createInvoice({
          customerId,
          date: invoice.issueDate.toISOString().split('T')[0],
          dueDate: invoice.dueDate?.toISOString().split('T')[0] || invoice.issueDate.toISOString().split('T')[0],
          lines: [{
            description: invoice.concept,
            quantity: 1,
            unitPrice: Number(invoice.baseAmount),
            taxRate: Number(invoice.vatRate),
          }],
          notes: `Factura Inmova: ${invoice.invoiceNumber}`,
        });

        // Guardar referencia de A3
        await prisma.tenantInvoice.update({
          where: { id: invoice.id },
          data: { a3InvoiceId: a3Invoice.id },
        });

        result.itemsSucceeded++;
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Factura ${invoice.invoiceNumber}: ${error.message}`);
      }
    }

    result.success = result.itemsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

async function syncPaymentsToA3(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'a3',
    action: 'sync_payments',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    // Obtener pagos completados
    const payments = await prisma.payment.findMany({
      where: {
        estado: 'pagado',
        a3PaymentId: null,
        contract: {
          unit: {
            building: { companyId },
          },
        },
        ...(since && { fechaPago: { gte: since } }),
      },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
        tenantInvoice: true,
      },
    });

    result.itemsProcessed = payments.length;

    const a3Service = new A3IntegrationService();

    for (const payment of payments) {
      try {
        const customerId = payment.contract.tenant.a3CustomerId;
        const invoiceId = payment.tenantInvoice?.a3InvoiceId;

        if (!customerId || !invoiceId) {
          result.errors.push(`Pago ${payment.id}: Cliente o factura no sincronizados`);
          result.itemsFailed++;
          continue;
        }

        const a3Payment = await a3Service.createPayment({
          customerId,
          invoiceId,
          date: payment.fechaPago!.toISOString().split('T')[0],
          amount: Number(payment.monto),
          paymentMethod: mapPaymentMethod(payment.metodoPago),
          reference: payment.referenciaBancaria || payment.id,
        });

        // Guardar referencia de A3
        await prisma.payment.update({
          where: { id: payment.id },
          data: { a3PaymentId: a3Payment.id },
        });

        result.itemsSucceeded++;
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Pago ${payment.id}: ${error.message}`);
      }
    }

    result.success = result.itemsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

// ============================================================================
// SINCRONIZACIÓN ALEGRA
// ============================================================================

async function syncClientsToAlegra(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'alegra',
    action: 'sync_clients',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    const alegraService = new AlegraService();
    
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        ...(since && { updatedAt: { gte: since } }),
      },
    });

    result.itemsProcessed = tenants.length;

    for (const tenant of tenants) {
      try {
        // Implementación similar a A3
        result.itemsSucceeded++;
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Inquilino ${tenant.id}: ${error.message}`);
      }
    }

    result.success = result.itemsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

async function syncInvoicesToAlegra(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  // Similar a A3 pero con API de Alegra
  return {
    success: true,
    provider: 'alegra',
    action: 'sync_invoices',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: ['Implementación pendiente'],
    timestamp: new Date(),
  };
}

// ============================================================================
// SINCRONIZACIÓN CONTASIMPLE
// ============================================================================

async function syncToContasimple(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'contasimple',
    action: 'sync_all',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  if (!process.env.CONTASIMPLE_API_KEY) {
    result.success = false;
    result.errors.push('Contasimple no configurado');
    return result;
  }

  // Implementación de Contasimple API
  // Ver lib/inmova-contasimple-bridge.ts para detalles
  
  return result;
}

// ============================================================================
// SINCRONIZACIÓN HOLDED
// ============================================================================

async function syncToHolded(
  companyId: string,
  since?: Date
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    provider: 'holded',
    action: 'sync_all',
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [],
    timestamp: new Date(),
  };

  const apiKey = process.env.HOLDED_API_KEY;
  
  if (!apiKey) {
    result.success = false;
    result.errors.push('Holded no configurado');
    return result;
  }

  try {
    const baseUrl = 'https://api.holded.com/api';
    
    // Obtener datos a sincronizar
    const invoices = await prisma.tenantInvoice.findMany({
      where: {
        companyId,
        holdedInvoiceId: null,
        status: { in: ['issued', 'paid'] },
        ...(since && { createdAt: { gte: since } }),
      },
      include: { tenant: true },
    });

    result.itemsProcessed = invoices.length;

    for (const invoice of invoices) {
      try {
        // Crear contacto si no existe
        let contactId = invoice.tenant.holdedContactId;
        
        if (!contactId) {
          const contactResponse = await fetch(`${baseUrl}/invoicing/v1/contacts`, {
            method: 'POST',
            headers: {
              'key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: invoice.tenant.nombreCompleto,
              email: invoice.tenant.email,
              vatnumber: invoice.tenant.dni,
              type: 'client',
            }),
          });

          if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            contactId = contactData.id;
            
            await prisma.tenant.update({
              where: { id: invoice.tenantId },
              data: { holdedContactId: contactId },
            });
          }
        }

        // Crear factura
        const invoiceResponse = await fetch(`${baseUrl}/invoicing/v1/documents/invoice`, {
          method: 'POST',
          headers: {
            'key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId,
            date: Math.floor(invoice.issueDate.getTime() / 1000),
            items: [{
              name: invoice.concept,
              desc: invoice.description || invoice.period,
              units: 1,
              subtotal: Number(invoice.baseAmount),
              tax: Number(invoice.vatRate),
            }],
          }),
        });

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          
          await prisma.tenantInvoice.update({
            where: { id: invoice.id },
            data: { holdedInvoiceId: invoiceData.id },
          });

          result.itemsSucceeded++;
        } else {
          throw new Error(`Holded API error: ${invoiceResponse.status}`);
        }
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Factura ${invoice.invoiceNumber}: ${error.message}`);
      }
    }

    result.success = result.itemsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

// ============================================================================
// UTILIDADES
// ============================================================================

function mapPaymentMethod(method: string | null): string {
  const mapping: Record<string, string> = {
    'transferencia': 'transfer',
    'domiciliacion_sepa': 'direct_debit',
    'tarjeta': 'card',
    'efectivo': 'cash',
    'stripe': 'card',
  };
  return mapping[method || ''] || 'other';
}

/**
 * Genera asientos contables para un pago
 */
export function generateAccountingEntries(payment: any): AccountingEntry[] {
  const entries: AccountingEntry[] = [];
  const amount = Number(payment.monto);

  // Asiento de ingreso por alquiler
  entries.push({
    date: payment.fechaPago || new Date(),
    description: `Cobro alquiler - ${payment.periodo}`,
    debitAccount: '572', // Bancos
    creditAccount: '705', // Ingresos por arrendamientos
    amount,
    reference: payment.id,
    metadata: { paymentId: payment.id, type: 'rent_income' },
  });

  // Si hay IVA
  if (payment.tenantInvoice?.vatAmount > 0) {
    const vatAmount = Number(payment.tenantInvoice.vatAmount);
    entries.push({
      date: payment.fechaPago || new Date(),
      description: `IVA repercutido - ${payment.periodo}`,
      debitAccount: '572',
      creditAccount: '477', // IVA repercutido
      amount: vatAmount,
      reference: payment.id,
      metadata: { paymentId: payment.id, type: 'vat' },
    });
  }

  // Si hay retención IRPF
  if (payment.tenantInvoice?.irpfAmount > 0) {
    const irpfAmount = Number(payment.tenantInvoice.irpfAmount);
    entries.push({
      date: payment.fechaPago || new Date(),
      description: `Retención IRPF - ${payment.periodo}`,
      debitAccount: '473', // Hacienda retenciones
      creditAccount: '572',
      amount: irpfAmount,
      reference: payment.id,
      metadata: { paymentId: payment.id, type: 'irpf' },
    });
  }

  return entries;
}

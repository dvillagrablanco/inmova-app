/**
 * API Route: Sincronización con Zucchetti
 *
 * POST /api/integrations/zucchetti/sync
 * Sincroniza datos entre INMOVA y Zucchetti
 *
 * Soporta sincronización de:
 * - Clientes/Inquilinos (tenants → customers)
 * - Pagos (payments → accounting entries)
 * - Gastos (expenses → accounting entries)
 * - Facturas (invoices)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';
import { getZucchettiTokens, refreshZucchettiToken } from '../callback/route';
import {
  getZucchettiAuthMode,
  isAltaiConfigured,
  sendAltaiEntry,
} from '@/lib/zucchetti-altai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ZUCCHETTI_API_URL = process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1';

// ═══════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

const syncRequestSchema = z.object({
  type: z.enum(['customers', 'payments', 'expenses', 'invoices', 'all']),
  ids: z.array(z.string()).optional(), // IDs específicos a sincronizar
  dateFrom: z.string().optional(), // Desde fecha
  dateTo: z.string().optional(), // Hasta fecha
  dryRun: z.boolean().optional().default(false), // Solo simular
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════════

interface SyncResult {
  type: string;
  synced: number;
  failed: number;
  errors: string[];
  details: any[];
}

/**
 * Sincroniza inquilinos de INMOVA a Zucchetti como clientes
 */
async function syncCustomers(
  companyId: string,
  accessToken: string,
  options: { ids?: string[]; dryRun?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    type: 'customers',
    synced: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  try {
    // Obtener inquilinos a sincronizar
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        isDemo: false,
        ...(options.ids && { id: { in: options.ids } }),
      },
      select: {
        id: true,
        nombreCompleto: true,
        dni: true,
        email: true,
        telefono: true,
        direccionActual: true,
      },
      take: 100, // Limitar a 100 por batch
    });

    for (const tenant of tenants) {
      try {
        // Mapear datos de INMOVA a formato Zucchetti
        const customerData = {
          customer_code: `TENANT_${tenant.id}`,
          name: tenant.nombreCompleto,
          tax_id: tenant.dni || '',
          email: tenant.email || '',
          phone: tenant.telefono || '',
          address: tenant.direccionActual
            ? {
                street: tenant.direccionActual,
                city: '',
                postal_code: '',
                country: 'ES',
              }
            : undefined,
        };

        if (options.dryRun) {
          result.details.push({ tenant: tenant.id, data: customerData, status: 'dry_run' });
          result.synced++;
          continue;
        }

        // Enviar a Zucchetti
        const response = await fetch(`${ZUCCHETTI_API_URL}/customers`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        });

        if (response.ok) {
          const zucchettiCustomer = await response.json();
          result.synced++;
          result.details.push({
            tenant: tenant.id,
            zucchettiId: zucchettiCustomer.id,
            status: 'synced',
          });
        } else {
          const errorText = await response.text();
          result.failed++;
          result.errors.push(`Tenant ${tenant.id}: ${errorText}`);
          result.details.push({
            tenant: tenant.id,
            status: 'failed',
            error: errorText,
          });
        }
      } catch (tenantError: any) {
        result.failed++;
        result.errors.push(`Tenant ${tenant.id}: ${tenantError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`);
  }

  return result;
}

/**
 * Sincroniza pagos de INMOVA a Zucchetti como asientos contables
 */
async function syncPayments(
  companyId: string,
  accessToken: string,
  options: { ids?: string[]; dateFrom?: string; dateTo?: string; dryRun?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    type: 'payments',
    synced: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  try {
    // Obtener pagos a sincronizar
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId,
            },
          },
        },
        status: 'pagado',
        ...(options.ids && { id: { in: options.ids } }),
        ...(options.dateFrom && { fechaPago: { gte: new Date(options.dateFrom) } }),
        ...(options.dateTo && { fechaPago: { lte: new Date(options.dateTo) } }),
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    for (const payment of payments) {
      try {
        // Mapear a asiento contable de Zucchetti
        const entryData = {
          entry_date:
            payment.fechaPago?.toISOString().split('T')[0] ||
            new Date().toISOString().split('T')[0],
          description: `Cobro renta - ${payment.contract?.unit?.building?.nombre || 'Propiedad'} - ${payment.contract?.tenant?.nombreCompleto || 'Inquilino'}`,
          reference: `PAYMENT_${payment.id}`,
          lines: [
            {
              account_code: '570001', // Bancos
              account_name: 'Caja/Bancos',
              debit: payment.monto,
              credit: 0,
              cost_center: payment.contract?.unit?.building?.id || '',
            },
            {
              account_code: '705001', // Ingresos
              account_name: 'Ingresos por Arrendamientos',
              debit: 0,
              credit: payment.monto,
              cost_center: payment.contract?.unit?.building?.id || '',
            },
          ],
        };

        if (options.dryRun) {
          result.details.push({ payment: payment.id, data: entryData, status: 'dry_run' });
          result.synced++;
          continue;
        }

        // Enviar a Zucchetti
        const response = await fetch(`${ZUCCHETTI_API_URL}/accounting/entries`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          const entry = await response.json();
          result.synced++;
          result.details.push({
            payment: payment.id,
            zucchettiEntryId: entry.entry_id,
            status: 'synced',
          });
        } else {
          const errorText = await response.text();
          result.failed++;
          result.errors.push(`Payment ${payment.id}: ${errorText}`);
        }
      } catch (paymentError: any) {
        result.failed++;
        result.errors.push(`Payment ${payment.id}: ${paymentError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`);
  }

  return result;
}

/**
 * Sincroniza gastos de INMOVA a Zucchetti como asientos contables
 */
async function syncExpenses(
  companyId: string,
  accessToken: string,
  options: { ids?: string[]; dateFrom?: string; dateTo?: string; dryRun?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    type: 'expenses',
    synced: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  try {
    // Obtener gastos a sincronizar
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        ...(options.ids && { id: { in: options.ids } }),
        ...(options.dateFrom && { fecha: { gte: new Date(options.dateFrom) } }),
        ...(options.dateTo && { fecha: { lte: new Date(options.dateTo) } }),
      },
      include: {
        provider: true,
        building: true,
      },
      take: 100,
    });

    for (const expense of expenses) {
      try {
        // Mapear a asiento contable
        const entryData = {
          entry_date:
            expense.fecha?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          description: `${expense.categoria || 'Gasto'} - ${expense.descripcion || ''} - ${expense.provider?.nombre || 'Proveedor'}`,
          reference: `EXPENSE_${expense.id}`,
          lines: [
            {
              account_code: '629001', // Gastos mantenimiento
              account_name: 'Gastos Mantenimiento y Reparaciones',
              debit: expense.monto,
              credit: 0,
              cost_center: expense.buildingId || '',
            },
            {
              account_code: '410001', // Acreedores
              account_name: 'Acreedores por servicios',
              debit: 0,
              credit: expense.monto,
              cost_center: expense.buildingId || '',
            },
          ],
        };

        if (options.dryRun) {
          result.details.push({ expense: expense.id, data: entryData, status: 'dry_run' });
          result.synced++;
          continue;
        }

        // Enviar a Zucchetti
        const response = await fetch(`${ZUCCHETTI_API_URL}/accounting/entries`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          const entry = await response.json();
          result.synced++;
          result.details.push({
            expense: expense.id,
            zucchettiEntryId: entry.entry_id,
            status: 'synced',
          });
        } else {
          const errorText = await response.text();
          result.failed++;
          result.errors.push(`Expense ${expense.id}: ${errorText}`);
        }
      } catch (expenseError: any) {
        result.failed++;
        result.errors.push(`Expense ${expense.id}: ${expenseError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`);
  }

  return result;
}

/**
 * Sincroniza inquilinos a Altai (no soportado actualmente)
 */
async function syncCustomersAltai(): Promise<SyncResult> {
  return {
    type: 'customers',
    synced: 0,
    failed: 0,
    errors: ['Altai no soporta sincronización de clientes en este endpoint'],
    details: [],
  };
}

/**
 * Sincroniza pagos de INMOVA a Altai como asientos contables
 */
async function syncPaymentsAltai(
  companyId: string,
  options: { ids?: string[]; dateFrom?: string; dateTo?: string; dryRun?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    type: 'payments',
    synced: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  try {
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId,
            },
          },
        },
        status: 'pagado',
        ...(options.ids && { id: { in: options.ids } }),
        ...(options.dateFrom && { fechaPago: { gte: new Date(options.dateFrom) } }),
        ...(options.dateTo && { fechaPago: { lte: new Date(options.dateTo) } }),
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    for (const payment of payments) {
      try {
        const entryData = {
          entry_date:
            payment.fechaPago?.toISOString().split('T')[0] ||
            new Date().toISOString().split('T')[0],
          description: `Cobro renta - ${payment.contract?.unit?.building?.nombre || 'Propiedad'} - ${payment.contract?.tenant?.nombreCompleto || 'Inquilino'}`,
          reference: `PAYMENT_${payment.id}`,
          lines: [
            {
              account_code: '570001',
              account_name: 'Caja/Bancos',
              debit: payment.monto,
              credit: 0,
              cost_center: payment.contract?.unit?.building?.id || '',
            },
            {
              account_code: '705001',
              account_name: 'Ingresos por Arrendamientos',
              debit: 0,
              credit: payment.monto,
              cost_center: payment.contract?.unit?.building?.id || '',
            },
          ],
        };

        if (options.dryRun) {
          result.details.push({ payment: payment.id, data: entryData, status: 'dry_run' });
          result.synced++;
          continue;
        }

        const response = await sendAltaiEntry(companyId, entryData);
        if (response.ok) {
          result.synced++;
          result.details.push({
            payment: payment.id,
            altaiResponse: response.data,
            status: 'synced',
          });
        } else {
          result.failed++;
          result.errors.push(`Payment ${payment.id}: ${response.error || response.status}`);
        }
      } catch (paymentError: any) {
        result.failed++;
        result.errors.push(`Payment ${payment.id}: ${paymentError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`);
  }

  return result;
}

/**
 * Sincroniza gastos de INMOVA a Altai como asientos contables
 */
async function syncExpensesAltai(
  companyId: string,
  options: { ids?: string[]; dateFrom?: string; dateTo?: string; dryRun?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    type: 'expenses',
    synced: 0,
    failed: 0,
    errors: [],
    details: [],
  };

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        building: {
          companyId,
        },
        ...(options.ids && { id: { in: options.ids } }),
        ...(options.dateFrom && { fecha: { gte: new Date(options.dateFrom) } }),
        ...(options.dateTo && { fecha: { lte: new Date(options.dateTo) } }),
      },
      include: {
        building: true,
      },
      take: 100,
    });

    for (const expense of expenses) {
      try {
        const entryData = {
          entry_date:
            expense.fecha?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          description: `Gasto - ${expense.concepto || 'Gasto'} - ${expense.building?.nombre || 'Propiedad'}`,
          reference: `EXPENSE_${expense.id}`,
          lines: [
            {
              account_code: '629001',
              account_name: 'Gastos Mantenimiento y Reparaciones',
              debit: expense.monto,
              credit: 0,
              cost_center: expense.building?.id || '',
            },
            {
              account_code: '410001',
              account_name: 'Acreedores por servicios',
              debit: 0,
              credit: expense.monto,
              cost_center: expense.building?.id || '',
            },
          ],
        };

        if (options.dryRun) {
          result.details.push({ expense: expense.id, data: entryData, status: 'dry_run' });
          result.synced++;
          continue;
        }

        const response = await sendAltaiEntry(companyId, entryData);
        if (response.ok) {
          result.synced++;
          result.details.push({
            expense: expense.id,
            altaiResponse: response.data,
            status: 'synced',
          });
        } else {
          result.failed++;
          result.errors.push(`Expense ${expense.id}: ${response.error || response.status}`);
        }
      } catch (expenseError: any) {
        result.failed++;
        result.errors.push(`Expense ${expense.id}: ${expenseError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error general: ${error.message}`);
  }

  return result;
}

/**
 * Sincroniza facturas a Altai (pendiente de especificación)
 */
async function syncInvoicesAltai(): Promise<SyncResult> {
  return {
    type: 'invoices',
    synced: 0,
    failed: 0,
    errors: ['Altai no tiene endpoint de facturas configurado'],
    details: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// POST - Ejecutar sincronización
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const authMode = getZucchettiAuthMode();

    // Validar request
    const body = await req.json();
    const validated = syncRequestSchema.parse(body);

    // Verificar integración activa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        zucchettiEnabled: true,
        zucchettiAccessToken: true,
      },
    });

    let zucchettiAccessToken: string | null = null;

    if (authMode === 'altai') {
      if (!isAltaiConfigured()) {
        return NextResponse.json(
          {
            success: false,
            message: 'Altai no está configurado',
          },
          { status: 400 }
        );
      }
    } else {
      if (!company?.zucchettiEnabled || !company.zucchettiAccessToken) {
        return NextResponse.json(
          {
            success: false,
            message: 'Zucchetti no está conectado',
          },
          { status: 400 }
        );
      }

      // Refrescar token si es necesario
      await refreshZucchettiToken(companyId);

      // Obtener tokens actualizados
      const tokens = await getZucchettiTokens(companyId);

      if (!tokens) {
        return NextResponse.json(
          {
            success: false,
            message: 'Error obteniendo tokens de Zucchetti',
          },
          { status: 500 }
        );
      }

      // Guardar token en variable para uso posterior
      zucchettiAccessToken = tokens.accessToken;
    }

    // Ejecutar sincronizaciones
    const results: SyncResult[] = [];
    const syncOptions = {
      ids: validated.ids,
      dateFrom: validated.dateFrom,
      dateTo: validated.dateTo,
      dryRun: validated.dryRun,
    };

    if (authMode === 'altai') {
      if (validated.type === 'customers' || validated.type === 'all') {
        results.push(await syncCustomersAltai());
      }

      if (validated.type === 'payments' || validated.type === 'all') {
        results.push(await syncPaymentsAltai(companyId, syncOptions));
      }

      if (validated.type === 'expenses' || validated.type === 'all') {
        results.push(await syncExpensesAltai(companyId, syncOptions));
      }

      if (validated.type === 'invoices' || validated.type === 'all') {
        results.push(await syncInvoicesAltai());
      }
    } else {
      if (!zucchettiAccessToken) {
        return NextResponse.json(
          {
            success: false,
            message: 'Token de Zucchetti no disponible',
          },
          { status: 500 }
        );
      }

      if (validated.type === 'customers' || validated.type === 'all') {
        results.push(await syncCustomers(companyId, zucchettiAccessToken, syncOptions));
      }

      if (validated.type === 'payments' || validated.type === 'all') {
        results.push(await syncPayments(companyId, zucchettiAccessToken, syncOptions));
      }

      if (validated.type === 'expenses' || validated.type === 'all') {
        results.push(await syncExpenses(companyId, zucchettiAccessToken, syncOptions));
      }
    }

    // Actualizar última sincronización
    const totalSynced = results.reduce((acc, r) => acc + r.synced, 0);
    const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

    if (!validated.dryRun) {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          zucchettiLastSync: new Date(),
          zucchettiSyncErrors: totalFailed > 0 ? totalFailed : 0,
        },
      });
    }

    // Log
    logger.info(`[Zucchetti Sync] Empresa ${companyId}:`, {
      type: validated.type,
      synced: totalSynced,
      failed: totalFailed,
      dryRun: validated.dryRun,
      authMode,
    });

    return NextResponse.json({
      success: totalFailed === 0,
      dryRun: validated.dryRun,
      authMode,
      summary: {
        totalSynced,
        totalFailed,
        syncedAt: new Date().toISOString(),
      },
      results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('[Zucchetti Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error en sincronización',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - Estado de última sincronización
// ═══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        zucchettiEnabled: true,
        zucchettiLastSync: true,
        zucchettiSyncErrors: true,
        zucchettiCompanyId: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: company.zucchettiEnabled,
        lastSync: company.zucchettiLastSync?.toISOString() || null,
        syncErrors: company.zucchettiSyncErrors,
        zucchettiCompanyId: company.zucchettiCompanyId,
        authMode: getZucchettiAuthMode(),
      },
    });
  } catch (error: any) {
    logger.error('[Zucchetti Sync Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo estado',
      },
      { status: 500 }
    );
  }
}

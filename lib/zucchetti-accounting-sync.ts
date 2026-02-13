/**
 * Servicio de sincronización contable con Zucchetti (Altai)
 * 
 * Envía apuntes de gastos e ingresos a Zucchetti automáticamente.
 * Solo aplica a empresas con zucchettiEnabled=true.
 * 
 * Flujo: unidireccional (Inmova → Zucchetti). No leemos de Zucchetti.
 */

import { sendAltaiEntry, type AltaiEntry } from './zucchetti-altai-service';
import logger from './logger';

// Plan de cuentas estándar (PGC español simplificado)
const CUENTAS = {
  // Gastos (grupo 6)
  gasto_mantenimiento: '622',    // Reparaciones y conservación
  gasto_reparacion: '622',
  gasto_servicio: '628',         // Suministros
  gasto_suministro: '628',
  gasto_seguro: '625',           // Primas de seguros
  gasto_impuesto: '631',         // Otros tributos
  gasto_comunidad: '621',        // Arrendamientos y cánones
  gasto_personal: '640',         // Sueldos y salarios
  gasto_profesional: '623',      // Servicios profesionales independientes
  gasto_administracion: '629',   // Otros servicios
  gasto_financiero: '662',       // Intereses de deudas
  gasto_amortizacion: '681',     // Amortización inmovilizado material
  gasto_otro: '629',             // Otros servicios
  // Categorías operativas (Expense)
  mantenimiento: '622',
  reparaciones: '622',
  servicios: '628',
  comunidad: '621',
  impuestos: '631',
  seguros: '625',
  personal: '640',
  marketing: '627',              // Publicidad y propaganda
  legal: '623',
  suministros: '628',
  tecnologia: '629',
  otro: '629',
  // Ingresos (grupo 7)
  ingreso_renta: '752',          // Ingresos por arrendamientos
  ingreso_otro: '759',           // Otros ingresos
  // Cuentas de contrapartida
  banco: '572',                  // Bancos c/c
  proveedores: '400',            // Proveedores
  clientes: '440',               // Deudores varios
  caja: '570',                   // Caja
};

/**
 * Obtiene el código de cuenta para una categoría
 */
function getAccountCode(categoria: string, tipo: 'gasto' | 'ingreso'): string {
  if (tipo === 'ingreso') {
    return CUENTAS.ingreso_renta;
  }
  return (CUENTAS as Record<string, string>)[categoria] || CUENTAS.gasto_otro;
}

/**
 * Envía un gasto a Zucchetti como asiento contable
 */
export async function syncExpenseToZucchetti(params: {
  companyId: string;
  concepto: string;
  monto: number;
  fecha: Date | string;
  categoria: string;
  providerName?: string;
  buildingName?: string;
  unitNumero?: string;
  expenseId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { getPrismaClient } = await import('./db');
    const prisma = getPrismaClient();

    // Verificar si la empresa tiene Zucchetti habilitado
    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: { zucchettiEnabled: true, zucchettiCompanyId: true, nombre: true },
    });

    if (!company?.zucchettiEnabled || !company?.zucchettiCompanyId) {
      return { ok: true }; // No es error, simplemente no tiene Zucchetti
    }

    const fecha = typeof params.fecha === 'string' 
      ? new Date(params.fecha) 
      : params.fecha;

    const cuentaGasto = getAccountCode(params.categoria, 'gasto');
    
    // Referencia descriptiva
    const refParts = [params.concepto];
    if (params.providerName) refParts.push(`Prov: ${params.providerName}`);
    if (params.buildingName) refParts.push(`Ed: ${params.buildingName}`);
    if (params.unitNumero) refParts.push(`Ud: ${params.unitNumero}`);
    const reference = refParts.join(' | ');

    const entry: AltaiEntry = {
      entry_date: fecha.toISOString().split('T')[0], // YYYY-MM-DD
      description: params.concepto.substring(0, 200),
      reference: params.expenseId || reference.substring(0, 100),
      lines: [
        {
          account_code: cuentaGasto,
          account_name: params.concepto.substring(0, 100),
          debit: params.monto,
          credit: 0,
        },
        {
          account_code: CUENTAS.proveedores,
          account_name: params.providerName || 'Proveedores',
          debit: 0,
          credit: params.monto,
        },
      ],
    };

    const result = await sendAltaiEntry(params.companyId, entry);

    if (result.ok) {
      logger.info(`[Zucchetti] Gasto sincronizado: ${params.concepto} (${params.monto}€)`, {
        companyId: params.companyId,
        empresa: company.nombre,
      });
    } else {
      logger.warn(`[Zucchetti] Error sincronizando gasto: ${result.error}`, {
        companyId: params.companyId,
      });
    }

    return result;
  } catch (error: any) {
    logger.error('[Zucchetti] Error en syncExpenseToZucchetti:', error.message);
    return { ok: false, error: error.message };
  }
}

/**
 * Envía un ingreso (pago recibido) a Zucchetti como asiento contable
 */
export async function syncIncomeToZucchetti(params: {
  companyId: string;
  concepto: string;
  monto: number;
  fecha: Date | string;
  tenantName?: string;
  buildingName?: string;
  unitNumero?: string;
  paymentId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { getPrismaClient } = await import('./db');
    const prisma = getPrismaClient();

    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: { zucchettiEnabled: true, zucchettiCompanyId: true, nombre: true },
    });

    if (!company?.zucchettiEnabled || !company?.zucchettiCompanyId) {
      return { ok: true };
    }

    const fecha = typeof params.fecha === 'string' 
      ? new Date(params.fecha) 
      : params.fecha;

    const refParts = [params.concepto];
    if (params.tenantName) refParts.push(`Inq: ${params.tenantName}`);
    if (params.buildingName) refParts.push(`Ed: ${params.buildingName}`);
    if (params.unitNumero) refParts.push(`Ud: ${params.unitNumero}`);

    const entry: AltaiEntry = {
      entry_date: fecha.toISOString().split('T')[0],
      description: params.concepto.substring(0, 200),
      reference: params.paymentId || refParts.join(' | ').substring(0, 100),
      lines: [
        {
          account_code: CUENTAS.banco,
          account_name: 'Banco c/c',
          debit: params.monto,
          credit: 0,
        },
        {
          account_code: CUENTAS.ingreso_renta,
          account_name: params.concepto.substring(0, 100),
          debit: 0,
          credit: params.monto,
        },
      ],
    };

    const result = await sendAltaiEntry(params.companyId, entry);

    if (result.ok) {
      logger.info(`[Zucchetti] Ingreso sincronizado: ${params.concepto} (${params.monto}€)`, {
        companyId: params.companyId,
        empresa: company.nombre,
      });
    } else {
      logger.warn(`[Zucchetti] Error sincronizando ingreso: ${result.error}`, {
        companyId: params.companyId,
      });
    }

    return result;
  } catch (error: any) {
    logger.error('[Zucchetti] Error en syncIncomeToZucchetti:', error.message);
    return { ok: false, error: error.message };
  }
}

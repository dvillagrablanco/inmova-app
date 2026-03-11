// @ts-nocheck
/**
 * Accounting Export Service — Exportación contable para gestorías
 *
 * Genera formatos estándar españoles:
 * - CSV formato PGC (Plan General Contable): cuenta, debe, haber, concepto, fecha
 * - Libro de facturas emitidas (alquileres)
 * - Libro de facturas recibidas (gastos)
 * - Resumen anual para modelo 200
 *
 * Para sociedades patrimoniales (Vidaro/Viroda/Rovida)
 */

import logger from '@/lib/logger';

// ============================================================
// TIPOS
// ============================================================

/** Asiento contable en formato PGC */
export interface AsientoContable {
  fecha: string; // DD/MM/YYYY
  asiento: number; // Número secuencial
  cuenta: string; // Código PGC (ej: "440000" para deudores)
  subcuenta: string; // Subcuenta (ej: "440001" para inquilino X)
  concepto: string;
  debe: number;
  haber: number;
  documento: string; // Número factura/referencia
}

/** Factura emitida (alquiler) */
export interface FacturaEmitida {
  numero: string;
  fecha: string;
  cliente: string;
  nifCliente: string;
  concepto: string;
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  total: number;
  formaPago: string;
  inmueble: string;
}

/** Factura recibida (gasto) */
export interface FacturaRecibida {
  numero: string;
  fecha: string;
  proveedor: string;
  nifProveedor: string;
  concepto: string;
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  irpfRetenido: number;
  total: number;
  inmueble: string;
}

// ============================================================
// CUENTAS PGC para inmobiliarias patrimoniales
// ============================================================

const CUENTAS_PGC = {
  // Ingresos
  ALQUILER_RESIDENCIAL: '752000', // Ingresos por arrendamientos
  ALQUILER_COMERCIAL: '752001',
  // Gastos
  IBI: '631000', // Otros tributos
  COMUNIDAD: '622000', // Servicios profesionales
  SEGUROS: '625000', // Primas de seguros
  REPARACIONES: '622100', // Reparaciones y conservación
  SUMINISTROS: '628000', // Suministros
  GESTION: '623000', // Servicios de administración
  AMORTIZACION: '681000', // Amortización inmov. material
  INTERESES: '662000', // Intereses de deudas
  OTROS_GASTOS: '629000', // Otros gastos
  // Balance
  BANCOS: '572000', // Bancos c/c
  DEUDORES_ALQUILER: '440000', // Deudores por alquiler
  PROVEEDORES: '400000', // Proveedores
  HP_IVA_REPERCUTIDO: '477000',
  HP_IVA_SOPORTADO: '472000',
  HP_IS: '473000', // Hacienda pública, retenciones IS
  AMORT_ACUMULADA: '281000', // Amortización acumulada inmuebles
  FIANZAS_RECIBIDAS: '180000', // Fianzas recibidas a LP
};

// ============================================================
// GENERACIÓN DE LIBROS Y EXPORTS
// ============================================================

/**
 * Genera el diario contable en formato PGC (CSV)
 */
export async function generateDiarioContable(
  companyId: string,
  ejercicio: number
): Promise<{ headers: string[]; rows: AsientoContable[] }> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio, 11, 31, 23, 59, 59);

  const rows: AsientoContable[] = [];
  let asientoNum = 1;

  // --- INGRESOS (cobros de alquiler) ---
  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
    include: {
      contract: {
        include: {
          tenant: { select: { nombre: true, apellidos: true, dni: true } },
          unit: { include: { building: { select: { nombre: true } } } },
        },
      },
    },
    orderBy: { fechaPago: 'asc' },
  });

  for (const p of payments) {
    const fecha = formatDate(p.fechaPago);
    const tenant = p.contract?.tenant;
    const building = p.contract?.unit?.building;
    const concepto = `Alquiler ${building?.nombre || ''} - ${tenant?.nombre || ''} ${tenant?.apellidos || ''}`;

    // Debe: Bancos (cobra)
    rows.push({
      fecha,
      asiento: asientoNum,
      cuenta: CUENTAS_PGC.BANCOS,
      subcuenta: CUENTAS_PGC.BANCOS,
      concepto,
      debe: p.monto,
      haber: 0,
      documento: `ALQ-${p.id.slice(-6)}`,
    });

    // Haber: Ingresos alquiler
    rows.push({
      fecha,
      asiento: asientoNum,
      cuenta: CUENTAS_PGC.ALQUILER_RESIDENCIAL,
      subcuenta: CUENTAS_PGC.ALQUILER_RESIDENCIAL,
      concepto,
      debe: 0,
      haber: p.monto,
      documento: `ALQ-${p.id.slice(-6)}`,
    });

    asientoNum++;
  }

  // --- GASTOS ---
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
    include: {
      building: { select: { nombre: true } },
      provider: { select: { nombre: true, cif: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  for (const e of expenses) {
    const fecha = formatDate(e.fecha);
    const concepto = `${e.concepto || e.categoria || 'Gasto'} - ${e.building?.nombre || ''}`;
    const cuentaGasto = mapCategoriaToCuenta(e.categoria || '');

    // Debe: Gasto
    rows.push({
      fecha,
      asiento: asientoNum,
      cuenta: cuentaGasto,
      subcuenta: cuentaGasto,
      concepto,
      debe: e.monto,
      haber: 0,
      documento: e.facturaPdfPath || `GAS-${e.id.slice(-6)}`,
    });

    // Haber: Bancos (paga)
    rows.push({
      fecha,
      asiento: asientoNum,
      cuenta: CUENTAS_PGC.BANCOS,
      subcuenta: CUENTAS_PGC.BANCOS,
      concepto,
      debe: 0,
      haber: e.monto,
      documento: e.facturaPdfPath || `GAS-${e.id.slice(-6)}`,
    });

    asientoNum++;
  }

  // --- AMORTIZACIONES ---
  const depreciations = await prisma.depreciationEntry.findMany({
    where: { asset: { companyId }, ano: ejercicio },
    include: { asset: { include: { building: { select: { nombre: true } } } } },
  });

  for (const d of depreciations) {
    const concepto = `Amortización anual - ${d.asset.building?.nombre || 'Inmueble'}`;

    rows.push({
      fecha: `31/12/${ejercicio}`,
      asiento: asientoNum,
      cuenta: CUENTAS_PGC.AMORTIZACION,
      subcuenta: CUENTAS_PGC.AMORTIZACION,
      concepto,
      debe: d.cuotaAnual,
      haber: 0,
      documento: `AMORT-${ejercicio}`,
    });

    rows.push({
      fecha: `31/12/${ejercicio}`,
      asiento: asientoNum,
      cuenta: CUENTAS_PGC.AMORT_ACUMULADA,
      subcuenta: CUENTAS_PGC.AMORT_ACUMULADA,
      concepto,
      debe: 0,
      haber: d.cuotaAnual,
      documento: `AMORT-${ejercicio}`,
    });

    asientoNum++;
  }

  const headers = [
    'Fecha',
    'Asiento',
    'Cuenta',
    'Subcuenta',
    'Concepto',
    'Debe',
    'Haber',
    'Documento',
  ];

  return { headers, rows };
}

/**
 * Genera libro de facturas emitidas (alquileres)
 */
export async function generateLibroFacturasEmitidas(
  companyId: string,
  ejercicio: number
): Promise<{ headers: string[]; rows: FacturaEmitida[] }> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio, 11, 31, 23, 59, 59);

  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
    include: {
      contract: {
        include: {
          tenant: { select: { nombre: true, apellidos: true, dni: true } },
          unit: { include: { building: { select: { nombre: true } } } },
        },
      },
    },
    orderBy: { fechaPago: 'asc' },
  });

  let factNum = 1;
  const rows: FacturaEmitida[] = payments.map((p) => {
    const tenant = p.contract?.tenant;
    const building = p.contract?.unit?.building;

    return {
      numero: `FE-${ejercicio}-${String(factNum++).padStart(4, '0')}`,
      fecha: formatDate(p.fechaPago),
      cliente: `${tenant?.nombre || ''} ${tenant?.apellidos || ''}`.trim(),
      nifCliente: tenant?.dni || '',
      concepto: `Alquiler ${building?.nombre || ''}`,
      baseImponible: p.monto,
      tipoIVA: 0, // Residencial exento
      cuotaIVA: 0,
      total: p.monto,
      formaPago: 'Transferencia bancaria',
      inmueble: building?.nombre || '',
    };
  });

  const headers = [
    'Número',
    'Fecha',
    'Cliente',
    'NIF',
    'Concepto',
    'Base Imponible',
    'Tipo IVA',
    'Cuota IVA',
    'Total',
    'Forma Pago',
    'Inmueble',
  ];

  return { headers, rows };
}

/**
 * Genera libro de facturas recibidas (gastos)
 */
export async function generateLibroFacturasRecibidas(
  companyId: string,
  ejercicio: number
): Promise<{ headers: string[]; rows: FacturaRecibida[] }> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio, 11, 31, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
    include: {
      building: { select: { nombre: true } },
      provider: { select: { nombre: true, cif: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  let factNum = 1;
  const rows: FacturaRecibida[] = expenses.map((e) => ({
    numero: e.facturaPdfPath || `FR-${ejercicio}-${String(factNum++).padStart(4, '0')}`,
    fecha: formatDate(e.fecha),
    proveedor: (e as any).provider?.nombre || 'Sin proveedor',
    nifProveedor: (e as any).provider?.cif || '',
    concepto: e.concepto || e.categoria || 'Gasto',
    baseImponible: e.monto,
    tipoIVA: 0, // Se puede mejorar con detección de IVA
    cuotaIVA: 0,
    irpfRetenido: 0,
    total: e.monto,
    inmueble: e.building?.nombre || '',
  }));

  const headers = [
    'Número',
    'Fecha',
    'Proveedor',
    'NIF',
    'Concepto',
    'Base Imponible',
    'Tipo IVA',
    'Cuota IVA',
    'IRPF Retenido',
    'Total',
    'Inmueble',
  ];

  return { headers, rows };
}

/**
 * Convierte datos a CSV
 */
export function toCSV(headers: string[], rows: Record<string, any>[]): string {
  const keys = Object.keys(rows[0] || {});
  const csvHeaders = headers.join(';');
  const csvRows = rows.map((row) =>
    keys
      .map((k) => {
        const v = row[k];
        if (typeof v === 'number') return String(v).replace('.', ','); // Formato español
        return `"${String(v || '').replace(/"/g, '""')}"`;
      })
      .join(';')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapCategoriaToCuenta(categoria: string): string {
  // ExpenseCategory enum: mantenimiento, impuestos, seguros, servicios, reparaciones, comunidad, otro
  switch (categoria) {
    case 'impuestos':
      return CUENTAS_PGC.IBI;
    case 'comunidad':
      return CUENTAS_PGC.COMUNIDAD;
    case 'seguros':
      return CUENTAS_PGC.SEGUROS;
    case 'reparaciones':
      return CUENTAS_PGC.REPARACIONES;
    case 'mantenimiento':
      return CUENTAS_PGC.REPARACIONES;
    case 'servicios':
      return CUENTAS_PGC.GESTION;
    default:
      return CUENTAS_PGC.OTROS_GASTOS;
  }
}

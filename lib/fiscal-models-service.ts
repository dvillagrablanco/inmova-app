// @ts-nocheck
/**
 * Fiscal Models Service — Generación de modelos tributarios españoles
 *
 * Modelos soportados:
 * - Modelo 202: Pago fraccionado IS (trimestral: abril, octubre, diciembre)
 * - Modelo 200: Declaración anual IS
 * - Modelo 303: IVA trimestral (locales comerciales)
 * - Modelo 347: Operaciones >3.005,06€ con terceros
 *
 * Para sociedades patrimoniales tipo Vidaro/Viroda/Rovida
 */

import logger from '@/lib/logger';

// ============================================================
// TIPOS
// ============================================================

export interface Modelo202 {
  modelo: '202';
  companyId: string;
  companyName: string;
  cif: string;
  ejercicio: number;
  periodo: '1P' | '2P' | '3P'; // Abril, Octubre, Diciembre
  // Datos
  baseImponibleUltimoIS: number;
  porcentajePagoFraccionado: number; // 18%
  importePagoFraccionado: number;
  retencionesIngresos: number;
  pagosAnteriores: number;
  resultadoAIngresar: number;
  // Metadatos
  fechaLimite: string; // "20 abril 2026" etc.
  generadoEl: string;
}

export interface Modelo200 {
  modelo: '200';
  companyId: string;
  companyName: string;
  cif: string;
  ejercicio: number;
  // Ingresos
  ingresosBrutos: number;
  ingresosAlquilerResidencial: number;
  ingresosAlquilerComercial: number;
  otrosIngresos: number;
  // Gastos deducibles
  gastosDeducibles: number;
  amortizaciones: number;
  interesesHipoteca: number;
  ibi: number;
  seguros: number;
  comunidad: number;
  reparacionesConservacion: number;
  gestionAdministracion: number;
  otrosGastos: number;
  // Cálculo IS
  baseImponible: number;
  tipoImpositivo: number; // 25%
  cuotaIntegra: number;
  deduccionesBonificaciones: number;
  cuotaLiquida: number;
  pagosFraccionados: number; // Total modelo 202 pagados
  retencionesIngresosACuenta: number;
  cuotaDiferencial: number; // A ingresar/devolver
  // Resultado
  resultadoDeclaracion: 'a_ingresar' | 'a_devolver' | 'cero';
  importeFinal: number;
  // Metadatos
  fechaLimite: string; // "25 julio"
  generadoEl: string;
}

export interface Modelo303 {
  modelo: '303';
  companyId: string;
  companyName: string;
  cif: string;
  ejercicio: number;
  trimestre: 1 | 2 | 3 | 4;
  // IVA repercutido (ventas/alquileres comerciales)
  baseIVARepercutido: number;
  tipoIVA: number; // 21%
  ivaRepercutido: number;
  // IVA soportado (gastos deducibles con IVA)
  baseIVASoportado: number;
  ivaSoportado: number;
  // Resultado
  diferenciaIVA: number; // repercutido - soportado
  compensacionPeriodosAnteriores: number;
  resultadoAIngresar: number;
  // Metadatos
  fechaLimite: string;
  generadoEl: string;
}

export interface Modelo347Entry {
  terceroNIF: string;
  terceroNombre: string;
  importeAnual: number;
  clave: 'A' | 'B'; // A=compras, B=ventas
  descripcion: string;
}

export interface Modelo347 {
  modelo: '347';
  companyId: string;
  companyName: string;
  cif: string;
  ejercicio: number;
  umbral: number; // 3.005,06€
  operaciones: Modelo347Entry[];
  totalOperaciones: number;
  generadoEl: string;
}

// ============================================================
// GENERACIÓN DE MODELOS
// ============================================================

/**
 * Genera borrador del Modelo 202 (Pago fraccionado IS)
 * Periodos: 1P=Abril (1-20), 2P=Octubre (1-20), 3P=Diciembre (1-20)
 */
export async function generateModelo202(
  companyId: string,
  ejercicio: number,
  periodo: '1P' | '2P' | '3P'
): Promise<Modelo202> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  // Obtener datos fiscales del ejercicio anterior para calcular base
  const { calculateFiscalSummary } = await import('@/lib/investment-service');
  const fiscalAnterior = await calculateFiscalSummary(companyId, ejercicio - 1);

  const baseImponibleUltimoIS = fiscalAnterior?.baseImponible ?? 0;
  const PORCENTAJE = 18;
  const importePagoFraccionado =
    Math.round(((baseImponibleUltimoIS * PORCENTAJE) / 100) * 100) / 100;

  // Pagos fraccionados anteriores del mismo ejercicio
  const periodoIndex = periodo === '1P' ? 0 : periodo === '2P' ? 1 : 2;
  const pagosAnteriores = Math.round(importePagoFraccionado * periodoIndex * 100) / 100;

  const fechasLimite: Record<string, string> = {
    '1P': `20 de abril de ${ejercicio}`,
    '2P': `20 de octubre de ${ejercicio}`,
    '3P': `20 de diciembre de ${ejercicio}`,
  };

  return {
    modelo: '202',
    companyId,
    companyName: company.nombre,
    cif: company.cif || '',
    ejercicio,
    periodo,
    baseImponibleUltimoIS,
    porcentajePagoFraccionado: PORCENTAJE,
    importePagoFraccionado,
    retencionesIngresos: 0,
    pagosAnteriores,
    resultadoAIngresar: importePagoFraccionado,
    fechaLimite: fechasLimite[periodo],
    generadoEl: new Date().toISOString(),
  };
}

/**
 * Genera borrador del Modelo 200 (Declaración anual IS)
 */
export async function generateModelo200(companyId: string, ejercicio: number): Promise<Modelo200> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio, 11, 31, 23, 59, 59);

  // --- INGRESOS ---
  // Alquileres residenciales
  const paymentsResidencial = await prisma.payment.findMany({
    where: {
      contract: {
        unit: { building: { companyId } },
        tipo: { not: 'comercial' },
      },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
  });
  const ingresosResidencial = paymentsResidencial.reduce((s, p) => s + p.monto, 0);

  // Alquileres comerciales
  const paymentsComercial = await prisma.commercialPayment.findMany({
    where: {
      lease: { space: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
  });
  const ingresosComercial = paymentsComercial.reduce((s, p) => s + p.importeBase, 0);

  const ingresosBrutos = ingresosResidencial + ingresosComercial;

  // --- GASTOS ---
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
  });

  // Clasificar gastos por categoría
  let ibi = 0,
    seguros = 0,
    comunidad = 0,
    reparaciones = 0,
    gestion = 0,
    otrosGastos = 0;
  for (const e of expenses) {
    const cat = String(e.categoria || '');
    switch (cat) {
      case 'impuestos':
        ibi += e.monto;
        break;
      case 'seguros':
        seguros += e.monto;
        break;
      case 'comunidad':
        comunidad += e.monto;
        break;
      case 'reparaciones':
        reparaciones += e.monto;
        break;
      case 'mantenimiento':
        reparaciones += e.monto;
        break;
      case 'servicios':
        gestion += e.monto;
        break;
      default:
        otrosGastos += e.monto;
    }
  }

  // Amortizaciones
  const depreciations = await prisma.depreciationEntry.findMany({
    where: { asset: { companyId }, ano: ejercicio },
  });
  const amortizaciones = depreciations.reduce((s, d) => s + d.cuotaAnual, 0);

  // Intereses hipoteca
  const mortgagePayments = await prisma.mortgagePayment.findMany({
    where: {
      mortgage: { companyId },
      fecha: { gte: startDate, lte: endDate },
      pagado: true,
    },
  });
  const interesesHipoteca = mortgagePayments.reduce((s, mp) => s + mp.intereses, 0);

  const gastosDeducibles = ibi + seguros + comunidad + reparaciones + gestion + otrosGastos;

  // --- CÁLCULO IS ---
  const baseImponible = Math.max(
    0,
    ingresosBrutos - gastosDeducibles - amortizaciones - interesesHipoteca
  );

  const TIPO = 25;
  const cuotaIntegra = Math.round(((baseImponible * TIPO) / 100) * 100) / 100;
  const deduccionesBonificaciones = 0; // Sin deducciones por defecto

  const cuotaLiquida = cuotaIntegra - deduccionesBonificaciones;

  // Pagos fraccionados realizados (modelo 202)
  const { calculateFiscalSummary } = await import('@/lib/investment-service');
  const fiscalSummary = await calculateFiscalSummary(companyId, ejercicio);
  const pagosFraccionados = (fiscalSummary?.pagosFraccionados ?? []).reduce(
    (s: number, p: { importe: number }) => s + p.importe,
    0
  );

  const cuotaDiferencial = Math.round((cuotaLiquida - pagosFraccionados) * 100) / 100;

  const r = (n: number) => Math.round(n * 100) / 100;

  return {
    modelo: '200',
    companyId,
    companyName: company.nombre,
    cif: company.cif || '',
    ejercicio,
    ingresosBrutos: r(ingresosBrutos),
    ingresosAlquilerResidencial: r(ingresosResidencial),
    ingresosAlquilerComercial: r(ingresosComercial),
    otrosIngresos: 0,
    gastosDeducibles: r(gastosDeducibles),
    amortizaciones: r(amortizaciones),
    interesesHipoteca: r(interesesHipoteca),
    ibi: r(ibi),
    seguros: r(seguros),
    comunidad: r(comunidad),
    reparacionesConservacion: r(reparaciones),
    gestionAdministracion: r(gestion),
    otrosGastos: r(otrosGastos),
    baseImponible: r(baseImponible),
    tipoImpositivo: TIPO,
    cuotaIntegra: r(cuotaIntegra),
    deduccionesBonificaciones: 0,
    cuotaLiquida: r(cuotaLiquida),
    pagosFraccionados: r(pagosFraccionados),
    retencionesIngresosACuenta: 0,
    cuotaDiferencial,
    resultadoDeclaracion:
      cuotaDiferencial > 0 ? 'a_ingresar' : cuotaDiferencial < 0 ? 'a_devolver' : 'cero',
    importeFinal: Math.abs(cuotaDiferencial),
    fechaLimite: `1-25 de julio de ${ejercicio + 1}`,
    generadoEl: new Date().toISOString(),
  };
}

/**
 * Genera borrador del Modelo 303 (IVA trimestral)
 * Solo aplica a alquileres comerciales (locales, oficinas, naves)
 * Alquileres residenciales están exentos de IVA
 */
export async function generateModelo303(
  companyId: string,
  ejercicio: number,
  trimestre: 1 | 2 | 3 | 4
): Promise<Modelo303> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  const mesInicio = (trimestre - 1) * 3;
  const startDate = new Date(ejercicio, mesInicio, 1);
  const endDate = new Date(ejercicio, mesInicio + 3, 0, 23, 59, 59);

  // IVA repercutido: alquileres comerciales del trimestre
  const commercialPayments = await prisma.commercialPayment.findMany({
    where: {
      lease: { space: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
  });

  const TIPO_IVA = 21;
  const baseIVARepercutido = commercialPayments.reduce((s, p) => s + p.importeBase, 0);
  const ivaRepercutido = Math.round(((baseIVARepercutido * TIPO_IVA) / 100) * 100) / 100;

  // IVA soportado: gastos con IVA deducible del trimestre
  // (solo gastos asociados a locales comerciales)
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
  });

  // Simplificación: considerar 21% de los gastos asociados a edificios con locales comerciales
  const buildingsWithCommercial = await prisma.building.findMany({
    where: { companyId },
    include: { commercialSpaces: { select: { id: true } } },
  });
  const commercialBuildingIds = new Set(
    buildingsWithCommercial.filter((b) => b.commercialSpaces.length > 0).map((b) => b.id)
  );

  const commercialExpenses = expenses.filter(
    (e) => e.buildingId && commercialBuildingIds.has(e.buildingId)
  );
  const baseIVASoportado = commercialExpenses.reduce((s, e) => s + e.monto, 0);
  const ivaSoportado = Math.round(((baseIVASoportado * TIPO_IVA) / 100) * 100) / 100;

  const diferenciaIVA = Math.round((ivaRepercutido - ivaSoportado) * 100) / 100;

  const fechasLimite: Record<number, string> = {
    1: `1-20 de abril de ${ejercicio}`,
    2: `1-20 de julio de ${ejercicio}`,
    3: `1-20 de octubre de ${ejercicio}`,
    4: `1-30 de enero de ${ejercicio + 1}`,
  };

  return {
    modelo: '303',
    companyId,
    companyName: company.nombre,
    cif: company.cif || '',
    ejercicio,
    trimestre,
    baseIVARepercutido: Math.round(baseIVARepercutido * 100) / 100,
    tipoIVA: TIPO_IVA,
    ivaRepercutido,
    baseIVASoportado: Math.round(baseIVASoportado * 100) / 100,
    ivaSoportado,
    diferenciaIVA,
    compensacionPeriodosAnteriores: 0,
    resultadoAIngresar: Math.max(0, diferenciaIVA),
    fechaLimite: fechasLimite[trimestre],
    generadoEl: new Date().toISOString(),
  };
}

/**
 * Genera borrador del Modelo 347 (Operaciones >3.005,06€)
 */
export async function generateModelo347(companyId: string, ejercicio: number): Promise<Modelo347> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  const startDate = new Date(ejercicio, 0, 1);
  const endDate = new Date(ejercicio, 11, 31, 23, 59, 59);
  const UMBRAL = 3005.06;

  // Gastos agrupados por proveedor
  const expenses = await prisma.expense.findMany({
    where: {
      building: { companyId },
      fecha: { gte: startDate, lte: endDate },
    },
    include: { provider: { select: { id: true, nombre: true, cif: true } } },
  });

  const proveedorTotals = new Map<string, { nombre: string; cif: string; total: number }>();
  for (const e of expenses) {
    if (e.provider) {
      const key = e.provider.id;
      const current = proveedorTotals.get(key) || {
        nombre: e.provider.nombre,
        cif: e.provider.cif || '',
        total: 0,
      };
      current.total += e.monto;
      proveedorTotals.set(key, current);
    }
  }

  // Ingresos agrupados por inquilino (alquileres)
  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId } } },
      estado: 'pagado',
      fechaPago: { gte: startDate, lte: endDate },
    },
    include: {
      contract: {
        include: {
          tenant: { select: { id: true, nombre: true, apellidos: true, dni: true } },
        },
      },
    },
  });

  const inquilinoTotals = new Map<string, { nombre: string; nif: string; total: number }>();
  for (const p of payments) {
    if (p.contract?.tenant) {
      const t = p.contract.tenant;
      const key = t.id;
      const current = inquilinoTotals.get(key) || {
        nombre: `${t.nombre} ${t.apellidos || ''}`.trim(),
        nif: t.dni || '',
        total: 0,
      };
      current.total += p.monto;
      inquilinoTotals.set(key, current);
    }
  }

  const operaciones: Modelo347Entry[] = [];

  // Compras (proveedores) > umbral
  for (const [, prov] of proveedorTotals) {
    if (prov.total > UMBRAL) {
      operaciones.push({
        terceroNIF: prov.cif,
        terceroNombre: prov.nombre,
        importeAnual: Math.round(prov.total * 100) / 100,
        clave: 'A',
        descripcion: 'Compras/servicios',
      });
    }
  }

  // Ventas (inquilinos) > umbral
  for (const [, inq] of inquilinoTotals) {
    if (inq.total > UMBRAL) {
      operaciones.push({
        terceroNIF: inq.nif,
        terceroNombre: inq.nombre,
        importeAnual: Math.round(inq.total * 100) / 100,
        clave: 'B',
        descripcion: 'Alquileres',
      });
    }
  }

  return {
    modelo: '347',
    companyId,
    companyName: company.nombre,
    cif: company.cif || '',
    ejercicio,
    umbral: UMBRAL,
    operaciones,
    totalOperaciones: operaciones.length,
    generadoEl: new Date().toISOString(),
  };
}

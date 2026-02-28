/**
 * Fiscal Simulator Service — Simulador "What-If" para sociedades patrimoniales
 *
 * Escenarios soportados:
 * 1. Venta de inmueble: plusvalía municipal + IS sobre ganancia patrimonial
 * 2. Subida de alquiler: impacto en ingresos brutos, IS, cash-flow
 * 3. Amortización anticipada de hipoteca: ahorro intereses vs liquidez
 * 4. Compra de nuevo inmueble: impacto en rentabilidad global y fiscalidad
 *
 * Cada escenario compara "situación actual" vs "situación simulada"
 */

import logger from '@/lib/logger';

// ============================================================
// TIPOS
// ============================================================

export interface ScenarioResult {
  escenario: string;
  descripcion: string;
  actual: FiscalSnapshot;
  simulado: FiscalSnapshot;
  diferencia: FiscalDiff;
  recomendacion: string;
}

export interface FiscalSnapshot {
  ingresosAnuales: number;
  gastosDeducibles: number;
  amortizaciones: number;
  interesesHipoteca: number;
  baseImponible: number;
  cuotaIS: number;
  cashFlowAnual: number;
  rentabilidadNeta: number; // %
}

export interface FiscalDiff {
  ingresosAnuales: number;
  cuotaIS: number;
  cashFlowAnual: number;
  rentabilidadNeta: number;
  impactoTotal: number; // Positivo = mejora, negativo = empeora
}

// ============================================================
// ESCENARIO 1: VENTA DE INMUEBLE
// ============================================================

export interface VentaInmuebleParams {
  companyId: string;
  assetId: string;
  precioVenta: number;
  gastosVenta?: number; // Comisión agencia, plusvalía municipal, notaría
  plusvaliaMunicipal?: number;
  year: number;
}

export async function simulateVentaInmueble(params: VentaInmuebleParams): Promise<ScenarioResult> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const { calculateFiscalSummary } = await import('@/lib/investment-service');

  const asset = await prisma.assetAcquisition.findFirst({
    where: { id: params.assetId, companyId: params.companyId },
    include: {
      mortgages: { where: { estado: 'activa' } },
      building: { select: { nombre: true } },
    },
  });

  if (!asset) throw new Error('Activo no encontrado');

  // Situación actual
  const fiscalActual = await calculateFiscalSummary(params.companyId, params.year);
  const actual = fiscalToSnapshot(fiscalActual);

  // Calcular ganancia patrimonial
  const valorContable = (asset.inversionTotal || asset.precioCompra) - asset.amortizacionAcumulada;
  const gananciaPatrimonial = params.precioVenta - valorContable - (params.gastosVenta || 0);
  const plusvaliaMunicipal = params.plusvaliaMunicipal || 0;

  // IS sobre ganancia: 25% (integrado en base general para SL patrimonial)
  const isGanancia = Math.max(0, gananciaPatrimonial) * 0.25;

  // Cancelación hipoteca (si tiene)
  const deudaHipoteca = asset.mortgages.reduce((s, m) => s + m.capitalPendiente, 0);
  const neto = params.precioVenta - (params.gastosVenta || 0) - plusvaliaMunicipal - isGanancia - deudaHipoteca;

  // Situación simulada: sin el activo, sin sus ingresos/gastos
  // Estimación simplificada: restar renta anual del activo
  const units = await prisma.unit.findMany({
    where: { buildingId: asset.buildingId || undefined },
    select: { rentaMensual: true },
  });
  const rentaAnualActivo = units.reduce((s, u) => s + (u.rentaMensual || 0), 0) * 12;

  const simulado: FiscalSnapshot = {
    ingresosAnuales: actual.ingresosAnuales - rentaAnualActivo,
    gastosDeducibles: actual.gastosDeducibles * 0.85, // Estimación: se eliminan gastos del activo
    amortizaciones: actual.amortizaciones - (asset.amortizacionAcumulada > 0 ? fiscalActual.amortizaciones * 0.3 : 0),
    interesesHipoteca: actual.interesesHipoteca - asset.mortgages.reduce((s, m) => s + m.cuotaMensual * 12 * 0.3, 0),
    baseImponible: 0,
    cuotaIS: 0,
    cashFlowAnual: 0,
    rentabilidadNeta: 0,
  };

  simulado.baseImponible = Math.max(0,
    simulado.ingresosAnuales - simulado.gastosDeducibles - simulado.amortizaciones - simulado.interesesHipoteca
  );
  simulado.cuotaIS = simulado.baseImponible * 0.25;
  simulado.cashFlowAnual = simulado.ingresosAnuales - simulado.gastosDeducibles - simulado.cuotaIS;
  simulado.rentabilidadNeta = actual.ingresosAnuales > 0
    ? (simulado.cashFlowAnual / actual.ingresosAnuales) * 100
    : 0;

  const diff = calcDiff(actual, simulado);
  diff.impactoTotal = neto; // Neto de la venta

  const esRentable = neto > rentaAnualActivo * 10; // Más de 10 años de renta
  const recomendacion = esRentable
    ? `Venta recomendable: neto ${fmt(neto)} > 10 años de renta (${fmt(rentaAnualActivo * 10)}). Ganancia patrimonial: ${fmt(gananciaPatrimonial)}, IS: ${fmt(isGanancia)}.`
    : `Venta no recomendable a corto plazo: neto ${fmt(neto)} < 10 años de renta. Mantener el activo genera mejor rentabilidad recurrente.`;

  return {
    escenario: 'venta_inmueble',
    descripcion: `Venta de ${asset.building?.nombre || 'inmueble'} por ${fmt(params.precioVenta)}`,
    actual,
    simulado,
    diferencia: diff,
    recomendacion,
  };
}

// ============================================================
// ESCENARIO 2: SUBIDA DE ALQUILER
// ============================================================

export interface SubidaAlquilerParams {
  companyId: string;
  porcentajeSubida: number; // ej: 5 para 5%
  year: number;
}

export async function simulateSubidaAlquiler(params: SubidaAlquilerParams): Promise<ScenarioResult> {
  const { calculateFiscalSummary } = await import('@/lib/investment-service');

  const fiscalActual = await calculateFiscalSummary(params.companyId, params.year);
  const actual = fiscalToSnapshot(fiscalActual);

  const factor = 1 + params.porcentajeSubida / 100;
  const nuevoIngreso = actual.ingresosAnuales * factor;
  const incremento = nuevoIngreso - actual.ingresosAnuales;

  const simulado: FiscalSnapshot = {
    ...actual,
    ingresosAnuales: Math.round(nuevoIngreso * 100) / 100,
    baseImponible: Math.max(0,
      nuevoIngreso - actual.gastosDeducibles - actual.amortizaciones - actual.interesesHipoteca
    ),
    cuotaIS: 0,
    cashFlowAnual: 0,
    rentabilidadNeta: 0,
  };

  simulado.cuotaIS = Math.round(simulado.baseImponible * 0.25 * 100) / 100;
  simulado.cashFlowAnual = simulado.ingresosAnuales - actual.gastosDeducibles - simulado.cuotaIS;
  simulado.rentabilidadNeta = simulado.ingresosAnuales > 0
    ? Math.round((simulado.cashFlowAnual / simulado.ingresosAnuales) * 10000) / 100
    : 0;

  const diff = calcDiff(actual, simulado);

  // Solo el 75% del incremento va al bolsillo (25% IS)
  const incrementoNeto = incremento * 0.75;

  return {
    escenario: 'subida_alquiler',
    descripcion: `Subida de alquiler del ${params.porcentajeSubida}%`,
    actual,
    simulado,
    diferencia: diff,
    recomendacion: `Subida del ${params.porcentajeSubida}% genera ${fmt(incremento)} más de ingresos brutos, pero solo ${fmt(incrementoNeto)} netos (25% IS). IS sube de ${fmt(actual.cuotaIS)} a ${fmt(simulado.cuotaIS)}.`,
  };
}

// ============================================================
// ESCENARIO 3: AMORTIZACIÓN ANTICIPADA DE HIPOTECA
// ============================================================

export interface AmortizacionAnticipadaParams {
  companyId: string;
  mortgageId: string;
  importeAmortizacion: number;
  year: number;
}

export async function simulateAmortizacionAnticipada(params: AmortizacionAnticipadaParams): Promise<ScenarioResult> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const { calculateFiscalSummary } = await import('@/lib/investment-service');

  const mortgage = await prisma.mortgage.findFirst({
    where: { id: params.mortgageId, companyId: params.companyId },
  });

  if (!mortgage) throw new Error('Hipoteca no encontrada');

  const fiscalActual = await calculateFiscalSummary(params.companyId, params.year);
  const actual = fiscalToSnapshot(fiscalActual);

  // Calcular ahorro de intereses
  const tipoMensual = mortgage.tipoInteres / 100 / 12;
  const mesesRestantes = Math.max(1,
    (mortgage.fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );

  const nuevoCapital = Math.max(0, mortgage.capitalPendiente - params.importeAmortizacion);
  const ahorroInteresesAnual = (mortgage.capitalPendiente - nuevoCapital) * tipoMensual * 12;

  // Nueva cuota (si se reduce cuota, no plazo)
  const nuevaCuota = tipoMensual > 0
    ? nuevoCapital * (tipoMensual * Math.pow(1 + tipoMensual, mesesRestantes)) / (Math.pow(1 + tipoMensual, mesesRestantes) - 1)
    : nuevoCapital / mesesRestantes;
  const ahorroCuotaMensual = mortgage.cuotaMensual - nuevaCuota;

  const simulado: FiscalSnapshot = {
    ...actual,
    interesesHipoteca: Math.max(0, actual.interesesHipoteca - ahorroInteresesAnual),
    baseImponible: 0,
    cuotaIS: 0,
    cashFlowAnual: 0,
    rentabilidadNeta: 0,
  };

  // Al reducir intereses deducibles, SUBE la base imponible
  simulado.baseImponible = Math.max(0,
    actual.ingresosAnuales - actual.gastosDeducibles - actual.amortizaciones - simulado.interesesHipoteca
  );
  simulado.cuotaIS = Math.round(simulado.baseImponible * 0.25 * 100) / 100;
  simulado.cashFlowAnual = actual.ingresosAnuales - actual.gastosDeducibles - simulado.cuotaIS + (ahorroCuotaMensual * 12);

  const diff = calcDiff(actual, simulado);
  diff.impactoTotal = (ahorroCuotaMensual * 12) - (simulado.cuotaIS - actual.cuotaIS);

  const ahorroTotalIntereses = ahorroInteresesAnual * (mesesRestantes / 12);

  return {
    escenario: 'amortizacion_anticipada',
    descripcion: `Amortización anticipada de ${fmt(params.importeAmortizacion)} en hipoteca ${mortgage.entidadFinanciera}`,
    actual,
    simulado,
    diferencia: diff,
    recomendacion: `Amortizar ${fmt(params.importeAmortizacion)}: cuota baja ${fmt(ahorroCuotaMensual)}/mes. Ahorro total intereses: ${fmt(ahorroTotalIntereses)}. Pero intereses deducibles bajan → IS sube ${fmt(simulado.cuotaIS - actual.cuotaIS)}/año. Impacto neto anual: ${fmt(diff.impactoTotal)}.`,
  };
}

// ============================================================
// ESCENARIO 4: COMPRA DE NUEVO INMUEBLE
// ============================================================

export interface CompraInmuebleParams {
  companyId: string;
  precioCompra: number;
  gastosCompra: number; // Notaría, registro, ITP
  rentaMensualEstimada: number;
  gastosAnualesEstimados: number; // IBI, comunidad, seguro, mantenimiento
  financiacion?: {
    ltv: number; // % financiado
    tipoInteres: number;
    plazoAnos: number;
  };
  year: number;
}

export async function simulateCompraInmueble(params: CompraInmuebleParams): Promise<ScenarioResult> {
  const { calculateFiscalSummary } = await import('@/lib/investment-service');

  const fiscalActual = await calculateFiscalSummary(params.companyId, params.year);
  const actual = fiscalToSnapshot(fiscalActual);

  const inversionTotal = params.precioCompra + params.gastosCompra;
  const rentaAnual = params.rentaMensualEstimada * 12;
  const amortizacionNueva = params.precioCompra * 0.5 * 0.03; // 3% sobre 50% construcción

  // Hipoteca nueva (si aplica)
  let cuotaHipotecaAnual = 0;
  let interesesAnuales = 0;
  if (params.financiacion) {
    const importeHipoteca = params.precioCompra * params.financiacion.ltv / 100;
    const tipoMensual = params.financiacion.tipoInteres / 100 / 12;
    const meses = params.financiacion.plazoAnos * 12;
    const cuotaMensual = tipoMensual > 0
      ? importeHipoteca * (tipoMensual * Math.pow(1 + tipoMensual, meses)) / (Math.pow(1 + tipoMensual, meses) - 1)
      : importeHipoteca / meses;
    cuotaHipotecaAnual = cuotaMensual * 12;
    // Primer año: casi todo intereses
    interesesAnuales = importeHipoteca * params.financiacion.tipoInteres / 100;
  }

  const simulado: FiscalSnapshot = {
    ingresosAnuales: actual.ingresosAnuales + rentaAnual,
    gastosDeducibles: actual.gastosDeducibles + params.gastosAnualesEstimados,
    amortizaciones: actual.amortizaciones + amortizacionNueva,
    interesesHipoteca: actual.interesesHipoteca + interesesAnuales,
    baseImponible: 0,
    cuotaIS: 0,
    cashFlowAnual: 0,
    rentabilidadNeta: 0,
  };

  simulado.baseImponible = Math.max(0,
    simulado.ingresosAnuales - simulado.gastosDeducibles - simulado.amortizaciones - simulado.interesesHipoteca
  );
  simulado.cuotaIS = Math.round(simulado.baseImponible * 0.25 * 100) / 100;
  simulado.cashFlowAnual = simulado.ingresosAnuales - simulado.gastosDeducibles - simulado.cuotaIS - cuotaHipotecaAnual;
  simulado.rentabilidadNeta = inversionTotal > 0
    ? Math.round((simulado.cashFlowAnual / inversionTotal) * 10000) / 100
    : 0;

  const diff = calcDiff(actual, simulado);

  const yieldBruto = (rentaAnual / inversionTotal) * 100;
  const cashOnCash = params.financiacion
    ? ((rentaAnual - params.gastosAnualesEstimados - cuotaHipotecaAnual) / (inversionTotal * (1 - params.financiacion.ltv / 100))) * 100
    : ((rentaAnual - params.gastosAnualesEstimados) / inversionTotal) * 100;

  return {
    escenario: 'compra_inmueble',
    descripcion: `Compra de inmueble por ${fmt(params.precioCompra)} con renta estimada ${fmt(params.rentaMensualEstimada)}/mes`,
    actual,
    simulado,
    diferencia: diff,
    recomendacion: `Yield bruto: ${yieldBruto.toFixed(1)}%. Cash-on-cash: ${cashOnCash.toFixed(1)}%. IS aumenta ${fmt(simulado.cuotaIS - actual.cuotaIS)}. Cash-flow neto del grupo ${diff.cashFlowAnual >= 0 ? 'mejora' : 'empeora'} ${fmt(Math.abs(diff.cashFlowAnual))}/año.`,
  };
}

// ============================================================
// HELPERS
// ============================================================

function fiscalToSnapshot(f: any): FiscalSnapshot {
  return {
    ingresosAnuales: f.ingresosBrutos,
    gastosDeducibles: f.gastosDeducibles,
    amortizaciones: f.amortizaciones,
    interesesHipoteca: f.interesesHipoteca,
    baseImponible: f.baseImponible,
    cuotaIS: f.cuotaIS,
    cashFlowAnual: f.ingresosBrutos - f.gastosDeducibles - f.cuotaIS,
    rentabilidadNeta: f.tipoEfectivo,
  };
}

function calcDiff(actual: FiscalSnapshot, simulado: FiscalSnapshot): FiscalDiff {
  return {
    ingresosAnuales: Math.round((simulado.ingresosAnuales - actual.ingresosAnuales) * 100) / 100,
    cuotaIS: Math.round((simulado.cuotaIS - actual.cuotaIS) * 100) / 100,
    cashFlowAnual: Math.round((simulado.cashFlowAnual - actual.cashFlowAnual) * 100) / 100,
    rentabilidadNeta: Math.round((simulado.rentabilidadNeta - actual.rentabilidadNeta) * 100) / 100,
    impactoTotal: Math.round((simulado.cashFlowAnual - actual.cashFlowAnual) * 100) / 100,
  };
}

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

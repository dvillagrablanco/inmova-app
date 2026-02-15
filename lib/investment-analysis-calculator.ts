/**
 * Investment Analysis Calculator
 *
 * Calcula rentabilidad, cash-flow y tabla de sensibilidad
 * para analisis de inversiones inmobiliarias.
 * Soporta rent roll con viviendas, garajes, locales, trasteros.
 *
 * La tabla de sensibilidad parte del asking price como MAXIMO
 * y baja en escalones hasta un % configurable.
 */

// ============================================================
// TIPOS
// ============================================================

export interface RentRollEntry {
  tipo: 'vivienda' | 'garaje' | 'local' | 'trastero' | 'oficina' | 'otro';
  referencia: string;        // Ej: "1A", "Garaje 3", "Local B"
  superficie?: number;       // m2
  rentaMensual: number;      // Renta mensual actual o estimada
  estado: 'alquilado' | 'vacio' | 'reforma';
  notas?: string;
}

export interface AnalysisInput {
  // Precio
  askingPrice: number;

  // Potencial de zona
  precioM2Zona?: number;       // EUR/m2 medio alquiler en la zona

  // Gastos de compra
  gastosNotaria: number;
  gastosRegistro: number;
  impuestoCompra: number;    // ITP (%) o importe fijo
  comisionCompra: number;    // % sobre precio
  otrosGastosCompra: number;

  // CAPEX
  capexReforma: number;
  capexImprevistos: number;  // % sobre capex
  capexOtros: number;

  // OPEX anual
  ibiAnual: number;
  comunidadMensual: number;
  seguroAnual: number;
  mantenimientoAnual: number;
  gestionAdminPct: number;   // % sobre renta bruta
  vacioEstimadoPct: number;  // % del ano sin inquilino
  comisionAlquilerPct: number; // comision por contratacion
  otrosGastosAnuales: number;

  // Financiacion
  usaFinanciacion: boolean;
  ltv?: number;              // % financiado
  tipoInteres?: number;      // % anual
  plazoAnos?: number;
  comisionApertura?: number; // %

  // Rent roll
  rentRoll: RentRollEntry[];
}

export interface AnalysisResult {
  // Rent roll agregado
  rentRollSummary: {
    totalUnidades: number;
    viviendas: number;
    garajes: number;
    locales: number;
    trasteros: number;
    otros: number;
    unidadesAlquiladas: number;
    unidadesVacias: number;
    ocupacionActual: number; // %
    superficieTotal: number;
  };

  // Ingresos
  rentaBrutaMensual: number;
  rentaBrutaAnual: number;
  ajusteVacio: number;        // Descuento por vacio estimado
  rentaEfectivaAnual: number; // Renta bruta - vacio

  // Gastos
  totalGastosCompra: number;
  totalCapex: number;
  opexAnual: number;
  detalleOpex: {
    ibi: number;
    comunidad: number;
    seguro: number;
    mantenimiento: number;
    gestionAdmin: number;
    comisionAlquiler: number;
    otros: number;
  };

  // Inversion
  inversionTotal: number;     // Precio + gastos compra + CAPEX

  // Financiacion
  importeHipoteca: number;
  capitalPropio: number;
  cuotaMensual: number;
  cuotaAnual: number;
  totalIntereses: number;     // Intereses totales vida del prestamo
  gastoFinanciacionInicial: number; // Comision apertura + tasacion

  // Resultados
  noiAnual: number;           // Net Operating Income = renta efectiva - opex
  cashFlowAnualPreTax: number; // NOI - cuota hipoteca
  yieldBruto: number;         // Renta bruta / inversion total
  yieldNeto: number;          // NOI / inversion total
  cashOnCash: number;         // Cash-flow / capital propio
  paybackAnos: number;        // Capital propio / cash-flow anual

  // Potencial de zona
  potencialZona: {
    precioM2Zona: number;
    rentaPotencialMensual: number;
    rentaPotencialAnual: number;
    yieldPotencial: number;           // Yield si se cobra a precio zona
    cashFlowPotencialAnual: number;
    gapRentaActualVsPotencial: number; // % diferencia
    upside: number;                    // EUR anuales extra si se sube a mercado
  } | null;

  // Tabla de sensibilidad
  tablaSensibilidad: SensitivityRow[];
}

export interface SensitivityRow {
  precio: number;
  descuentoPct: number;       // % de descuento sobre asking
  inversionTotal: number;
  capitalPropio: number;
  cuotaMensual: number;
  yieldBruto: number;
  yieldNeto: number;
  cashOnCash: number;
  cashFlowMensual: number;
  cashFlowAnual: number;
  paybackAnos: number;
}

// ============================================================
// CALCULADORA
// ============================================================

/**
 * Calcula la cuota mensual de un prestamo (sistema frances)
 */
function calcularCuotaMensual(capital: number, tipoAnual: number, plazoAnos: number): number {
  if (capital <= 0 || tipoAnual <= 0 || plazoAnos <= 0) return 0;
  const i = tipoAnual / 100 / 12; // Tipo mensual
  const n = plazoAnos * 12;       // Numero de cuotas
  return capital * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
}

/**
 * Calcula intereses totales vida del prestamo
 */
function calcularTotalIntereses(capital: number, tipoAnual: number, plazoAnos: number): number {
  const cuota = calcularCuotaMensual(capital, tipoAnual, plazoAnos);
  return (cuota * plazoAnos * 12) - capital;
}

/**
 * Ejecuta el analisis completo para un precio dado
 */
function calcularParaPrecio(input: AnalysisInput, precio: number): Omit<AnalysisResult, 'tablaSensibilidad' | 'rentRollSummary'> {
  // --- RENT ROLL ---
  const rentaBrutaMensual = input.rentRoll.reduce((s, u) => s + u.rentaMensual, 0);
  const rentaBrutaAnual = rentaBrutaMensual * 12;
  const ajusteVacio = rentaBrutaAnual * (input.vacioEstimadoPct / 100);
  const rentaEfectivaAnual = rentaBrutaAnual - ajusteVacio;

  // --- GASTOS COMPRA ---
  const impuesto = input.impuestoCompra > 100
    ? input.impuestoCompra  // Importe fijo
    : precio * (input.impuestoCompra / 100); // Porcentaje
  const comision = precio * (input.comisionCompra / 100);
  const totalGastosCompra = input.gastosNotaria + input.gastosRegistro + impuesto + comision + input.otrosGastosCompra;

  // --- CAPEX ---
  const imprevistos = input.capexReforma * (input.capexImprevistos / 100);
  const totalCapex = input.capexReforma + imprevistos + input.capexOtros;

  // --- INVERSION TOTAL ---
  const inversionTotal = precio + totalGastosCompra + totalCapex;

  // --- OPEX ---
  const gestionAdmin = rentaBrutaAnual * (input.gestionAdminPct / 100);
  const comisionAlquiler = rentaBrutaAnual * (input.comisionAlquilerPct / 100);
  const comunidadAnual = input.comunidadMensual * 12;
  const detalleOpex = {
    ibi: input.ibiAnual,
    comunidad: comunidadAnual,
    seguro: input.seguroAnual,
    mantenimiento: input.mantenimientoAnual,
    gestionAdmin,
    comisionAlquiler,
    otros: input.otrosGastosAnuales,
  };
  const opexAnual = Object.values(detalleOpex).reduce((s, v) => s + v, 0);

  // --- FINANCIACION ---
  let importeHipoteca = 0;
  let capitalPropio = inversionTotal;
  let cuotaMensual = 0;
  let cuotaAnual = 0;
  let totalIntereses = 0;
  let gastoFinanciacionInicial = 0;

  if (input.usaFinanciacion && input.ltv && input.tipoInteres && input.plazoAnos) {
    importeHipoteca = precio * (input.ltv / 100);
    capitalPropio = inversionTotal - importeHipoteca;
    cuotaMensual = calcularCuotaMensual(importeHipoteca, input.tipoInteres, input.plazoAnos);
    cuotaAnual = cuotaMensual * 12;
    totalIntereses = calcularTotalIntereses(importeHipoteca, input.tipoInteres, input.plazoAnos);
    gastoFinanciacionInicial = importeHipoteca * ((input.comisionApertura || 0) / 100);
    capitalPropio += gastoFinanciacionInicial;
  }

  // --- RESULTADOS ---
  const noiAnual = rentaEfectivaAnual - opexAnual;
  const cashFlowAnualPreTax = noiAnual - cuotaAnual;
  const yieldBruto = inversionTotal > 0 ? (rentaBrutaAnual / inversionTotal) * 100 : 0;
  const yieldNeto = inversionTotal > 0 ? (noiAnual / inversionTotal) * 100 : 0;
  const cashOnCash = capitalPropio > 0 ? (cashFlowAnualPreTax / capitalPropio) * 100 : 0;
  const paybackAnos = cashFlowAnualPreTax > 0 ? capitalPropio / cashFlowAnualPreTax : 999;

  return {
    rentaBrutaMensual: round(rentaBrutaMensual),
    rentaBrutaAnual: round(rentaBrutaAnual),
    ajusteVacio: round(ajusteVacio),
    rentaEfectivaAnual: round(rentaEfectivaAnual),
    totalGastosCompra: round(totalGastosCompra),
    totalCapex: round(totalCapex),
    opexAnual: round(opexAnual),
    detalleOpex: {
      ibi: round(detalleOpex.ibi),
      comunidad: round(detalleOpex.comunidad),
      seguro: round(detalleOpex.seguro),
      mantenimiento: round(detalleOpex.mantenimiento),
      gestionAdmin: round(detalleOpex.gestionAdmin),
      comisionAlquiler: round(detalleOpex.comisionAlquiler),
      otros: round(detalleOpex.otros),
    },
    inversionTotal: round(inversionTotal),
    importeHipoteca: round(importeHipoteca),
    capitalPropio: round(capitalPropio),
    cuotaMensual: round(cuotaMensual),
    cuotaAnual: round(cuotaAnual),
    totalIntereses: round(totalIntereses),
    gastoFinanciacionInicial: round(gastoFinanciacionInicial),
    noiAnual: round(noiAnual),
    cashFlowAnualPreTax: round(cashFlowAnualPreTax),
    yieldBruto: round(yieldBruto),
    yieldNeto: round(yieldNeto),
    cashOnCash: round(cashOnCash),
    paybackAnos: round(paybackAnos),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Ejecuta el analisis completo con tabla de sensibilidad.
 *
 * La tabla parte del asking price como MAXIMO y baja
 * en escalones del 5% hasta un 30% de descuento.
 */
export function runInvestmentAnalysis(input: AnalysisInput): AnalysisResult {
  // Rent roll summary
  const rentRollSummary = {
    totalUnidades: input.rentRoll.length,
    viviendas: input.rentRoll.filter(u => u.tipo === 'vivienda').length,
    garajes: input.rentRoll.filter(u => u.tipo === 'garaje').length,
    locales: input.rentRoll.filter(u => u.tipo === 'local').length,
    trasteros: input.rentRoll.filter(u => u.tipo === 'trastero').length,
    otros: input.rentRoll.filter(u => !['vivienda', 'garaje', 'local', 'trastero'].includes(u.tipo)).length,
    unidadesAlquiladas: input.rentRoll.filter(u => u.estado === 'alquilado').length,
    unidadesVacias: input.rentRoll.filter(u => u.estado === 'vacio').length,
    ocupacionActual: input.rentRoll.length > 0
      ? round((input.rentRoll.filter(u => u.estado === 'alquilado').length / input.rentRoll.length) * 100)
      : 0,
    superficieTotal: round(input.rentRoll.reduce((s, u) => s + (u.superficie || 0), 0)),
  };

  // Resultado base (al asking price)
  const base = calcularParaPrecio(input, input.askingPrice);

  // Tabla de sensibilidad: del asking price bajando 5% en 5% hasta -30%
  const descuentos = [0, 5, 10, 15, 20, 25, 30];
  const tablaSensibilidad: SensitivityRow[] = descuentos.map(pct => {
    const precio = round(input.askingPrice * (1 - pct / 100));
    const r = calcularParaPrecio(input, precio);
    return {
      precio,
      descuentoPct: pct,
      inversionTotal: r.inversionTotal,
      capitalPropio: r.capitalPropio,
      cuotaMensual: r.cuotaMensual,
      yieldBruto: r.yieldBruto,
      yieldNeto: r.yieldNeto,
      cashOnCash: r.cashOnCash,
      cashFlowMensual: round(r.cashFlowAnualPreTax / 12),
      cashFlowAnual: r.cashFlowAnualPreTax,
      paybackAnos: r.paybackAnos,
    };
  });

  // Potencial de zona (EUR/m2)
  let potencialZona: AnalysisResult['potencialZona'] = null;
  if (input.precioM2Zona && input.precioM2Zona > 0 && rentRollSummary.superficieTotal > 0) {
    const precioM2 = input.precioM2Zona;
    const rentaPotencialMensual = round(rentRollSummary.superficieTotal * precioM2);
    const rentaPotencialAnual = round(rentaPotencialMensual * 12);
    const ajusteVacioPotencial = rentaPotencialAnual * (input.vacioEstimadoPct / 100);
    const rentaEfectivaPotencial = rentaPotencialAnual - ajusteVacioPotencial;
    const noiPotencial = rentaEfectivaPotencial - base.opexAnual;
    const yieldPotencial = base.inversionTotal > 0
      ? round((noiPotencial / base.inversionTotal) * 100) : 0;
    const cashFlowPotencialAnual = round(noiPotencial - base.cuotaAnual);
    const gapPct = base.rentaBrutaAnual > 0
      ? round(((rentaPotencialAnual - base.rentaBrutaAnual) / base.rentaBrutaAnual) * 100) : 0;
    const upside = round(rentaPotencialAnual - base.rentaBrutaAnual);

    potencialZona = {
      precioM2Zona: precioM2,
      rentaPotencialMensual,
      rentaPotencialAnual,
      yieldPotencial,
      cashFlowPotencialAnual,
      gapRentaActualVsPotencial: gapPct,
      upside,
    };
  }

  return {
    rentRollSummary,
    ...base,
    potencialZona,
    tablaSensibilidad,
  };
}

/**
 * Calculadoras financieras para inversión inmobiliaria
 */

// ============================================================================
// CALCULADORA HIPOTECARIA
// ============================================================================

export interface MortgageInput {
  propertyPrice: number;
  downPaymentPercent: number; // e.g. 20
  interestRate: number; // annual, e.g. 3.5
  termYears: number; // e.g. 25
  monthlyRent: number;
}

export interface MortgageResult {
  loanAmount: number;
  downPayment: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  cashFlowAfterMortgage: number;
  leveragedYield: number; // ROI on equity (down payment)
  breakEvenYears: number;
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const downPayment = input.propertyPrice * (input.downPaymentPercent / 100);
  const loanAmount = input.propertyPrice - downPayment;
  const monthlyRate = input.interestRate / 100 / 12;
  const numPayments = input.termYears * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else {
    monthlyPayment = loanAmount / numPayments;
  }

  const totalCost = monthlyPayment * numPayments;
  const totalInterest = totalCost - loanAmount;
  const cashFlowAfterMortgage = input.monthlyRent - monthlyPayment;
  const annualCashFlow = cashFlowAfterMortgage * 12;
  const leveragedYield = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
  const breakEvenYears = annualCashFlow > 0 ? downPayment / annualCashFlow : 0;

  return {
    loanAmount: Math.round(loanAmount),
    downPayment: Math.round(downPayment),
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
    totalCost: Math.round(totalCost),
    cashFlowAfterMortgage: Math.round(cashFlowAfterMortgage),
    leveragedYield: parseFloat(leveragedYield.toFixed(2)),
    breakEvenYears: parseFloat(breakEvenYears.toFixed(1)),
  };
}

// ============================================================================
// ANÁLISIS DE SENSIBILIDAD
// ============================================================================

export interface SensitivityInput {
  basePrice: number;
  baseRent: number;
  baseExpenses: number;
}

export interface SensitivityResult {
  scenarios: {
    name: string;
    yieldNeto: number;
    cashFlowAnual: number;
    change: string;
  }[];
}

export function calculateSensitivity(input: SensitivityInput): SensitivityResult {
  const base = ((input.baseRent * 12 - input.baseExpenses) / input.basePrice) * 100;
  const baseCF = input.baseRent * 12 - input.baseExpenses;

  const scenarios = [
    { name: 'Base', rentMult: 1, expMult: 1, change: 'Escenario actual' },
    { name: 'Yield -1%', rentMult: 1 - (1 / (base || 1)) * (base > 0 ? 1 : 0), expMult: 1, change: 'Renta baja para reducir yield 1pp' },
    { name: 'Vacío 2 meses', rentMult: 10 / 12, expMult: 1, change: '2 meses sin inquilino al año' },
    { name: 'Gastos +20%', rentMult: 1, expMult: 1.2, change: 'IBI, comunidad, seguros suben' },
    { name: 'IPC +5%', rentMult: 1.05, expMult: 1.05, change: 'Renta y gastos suben con IPC' },
    { name: 'Peor caso', rentMult: 10 / 12, expMult: 1.3, change: 'Vacío 2m + gastos +30%' },
    { name: 'Mejor caso', rentMult: 1.1, expMult: 0.9, change: 'Renta +10% + gastos -10%' },
  ];

  return {
    scenarios: scenarios.map(s => {
      const rent = input.baseRent * s.rentMult;
      const exp = input.baseExpenses * s.expMult;
      const cf = rent * 12 - exp;
      const yld = input.basePrice > 0 ? (cf / input.basePrice) * 100 : 0;
      return {
        name: s.name,
        yieldNeto: parseFloat(yld.toFixed(2)),
        cashFlowAnual: Math.round(cf),
        change: s.change,
      };
    }),
  };
}

// ============================================================================
// ANÁLISIS FISCAL ESTIMADO
// ============================================================================

export interface FiscalInput {
  price: number;
  isNewBuild: boolean;
  province: string;
  annualRent: number;
  annualExpenses: number;
  ownerType: 'persona_fisica' | 'sociedad';
}

export interface FiscalResult {
  impuestoCompra: { concepto: string; importe: number; tipo: string }[];
  totalCompra: number;
  impuestosAnuales: { concepto: string; importe: number }[];
  totalAnual: number;
  irpfRenta: number;
  rentaNetoFiscal: number;
  tipoEfectivo: number;
}

export function calculateFiscalImpact(input: FiscalInput): FiscalResult {
  // ITP or IVA + AJD
  const impuestoCompra: { concepto: string; importe: number; tipo: string }[] = [];

  if (input.isNewBuild) {
    impuestoCompra.push({ concepto: 'IVA (obra nueva)', importe: Math.round(input.price * 0.10), tipo: '10%' });
    impuestoCompra.push({ concepto: 'AJD', importe: Math.round(input.price * 0.015), tipo: '1.5%' });
  } else {
    // ITP varies by CCAA (6-10%), use 8% as common
    const itpRates: Record<string, number> = {
      'Madrid': 0.06, 'Cataluña': 0.10, 'Andalucía': 0.07, 'Valencia': 0.10,
      'Málaga': 0.07, 'Barcelona': 0.10, 'Valladolid': 0.08,
    };
    const rate = Object.entries(itpRates).find(([k]) => input.province.includes(k))?.[1] || 0.08;
    impuestoCompra.push({ concepto: 'ITP', importe: Math.round(input.price * rate), tipo: `${(rate * 100).toFixed(0)}%` });
  }

  // Notaría + Registro + Gestoría
  impuestoCompra.push({ concepto: 'Notaría', importe: Math.round(input.price * 0.003 + 300), tipo: '~0.3%' });
  impuestoCompra.push({ concepto: 'Registro', importe: Math.round(input.price * 0.002 + 200), tipo: '~0.2%' });
  impuestoCompra.push({ concepto: 'Gestoría', importe: 500, tipo: 'Fijo' });

  const totalCompra = impuestoCompra.reduce((s, i) => s + i.importe, 0);

  // Annual taxes
  const ibi = Math.round(input.price * 0.005); // ~0.5% catastral
  const basura = 150;
  const impuestosAnuales = [
    { concepto: 'IBI', importe: ibi },
    { concepto: 'Tasa basuras', importe: basura },
  ];

  const totalAnual = impuestosAnuales.reduce((s, i) => s + i.importe, 0);

  // IRPF on rental income
  const deducibleAmortizacion = Math.round(input.price * 0.03); // 3% del valor construcción
  const baseImponible = Math.max(0, input.annualRent - input.annualExpenses - deducibleAmortizacion - ibi - basura);

  let irpfRate = 0.19; // Base
  if (input.ownerType === 'sociedad') {
    irpfRate = 0.25; // IS
  } else {
    if (baseImponible > 60000) irpfRate = 0.45;
    else if (baseImponible > 35200) irpfRate = 0.37;
    else if (baseImponible > 20200) irpfRate = 0.30;
    else if (baseImponible > 12450) irpfRate = 0.24;
  }

  // Reducción 60% por alquiler vivienda habitual (persona física)
  const baseReducida = input.ownerType === 'persona_fisica' ? baseImponible * 0.4 : baseImponible;
  const irpfRenta = Math.round(baseReducida * irpfRate);
  const rentaNetoFiscal = input.annualRent - input.annualExpenses - totalAnual - irpfRenta;
  const tipoEfectivo = input.annualRent > 0 ? (irpfRenta / input.annualRent) * 100 : 0;

  return {
    impuestoCompra,
    totalCompra,
    impuestosAnuales,
    totalAnual,
    irpfRenta,
    rentaNetoFiscal: Math.round(rentaNetoFiscal),
    tipoEfectivo: parseFloat(tipoEfectivo.toFixed(1)),
  };
}

// ============================================================================
// DUE DILIGENCE CHECKLIST
// ============================================================================

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  critical: boolean;
}

export function getDueDiligenceChecklist(propertyType: string, category: string): ChecklistItem[] {
  const base: ChecklistItem[] = [
    { id: 'nota-simple', text: 'Solicitar nota simple del Registro de la Propiedad', category: 'Legal', critical: true },
    { id: 'cargas', text: 'Verificar cargas, hipotecas y embargos', category: 'Legal', critical: true },
    { id: 'catastro', text: 'Comprobar datos catastrales (superficie, uso)', category: 'Legal', critical: true },
    { id: 'ibi', text: 'Solicitar último recibo IBI', category: 'Fiscal', critical: true },
    { id: 'comunidad', text: 'Pedir certificado de deudas con la comunidad', category: 'Legal', critical: true },
    { id: 'cee', text: 'Verificar certificado energético en vigor', category: 'Técnico', critical: false },
    { id: 'visita', text: 'Visita presencial al inmueble', category: 'Técnico', critical: true },
    { id: 'zona', text: 'Analizar entorno: transporte, servicios, comercios', category: 'Mercado', critical: false },
    { id: 'comparables', text: 'Revisar precios de comparables en la zona', category: 'Mercado', critical: true },
    { id: 'ite', text: 'Verificar ITE del edificio (si >50 años)', category: 'Técnico', critical: false },
  ];

  // Additional items by category
  if (category === 'subasta') {
    base.push(
      { id: 'deposito', text: 'Preparar depósito del 5% para participar', category: 'Financiero', critical: true },
      { id: 'ocupacion', text: 'Verificar si el inmueble está ocupado', category: 'Legal', critical: true },
      { id: 'posesion', text: 'Preparar procedimiento de toma de posesión', category: 'Legal', critical: true },
      { id: 'cargas-subasta', text: 'Analizar cargas anteriores a la subasta (no se cancelan)', category: 'Legal', critical: true },
    );
  }

  if (category === 'banca') {
    base.push(
      { id: 'negociar', text: 'Negociar 10-15% adicional sobre precio publicado', category: 'Financiero', critical: false },
      { id: 'estado', text: 'Verificar estado de conservación (puede necesitar reforma)', category: 'Técnico', critical: true },
      { id: 'hipoteca-banco', text: 'Consultar condiciones hipotecarias del propio banco vendedor', category: 'Financiero', critical: false },
    );
  }

  if (propertyType === 'local' || propertyType === 'oficina') {
    base.push(
      { id: 'licencia', text: 'Verificar licencia de actividad', category: 'Legal', critical: true },
      { id: 'accesibilidad', text: 'Comprobar accesibilidad (normativa vigente)', category: 'Técnico', critical: false },
    );
  }

  return base;
}

// ============================================================================
// CALCULADORA ALQUILER TRADICIONAL
// ============================================================================

export interface TraditionalRentalInput {
  precioCompra: number;
  gastosCompra: number;        // ITP, notaría, registro, gestoría (puede venir de calculateFiscalImpact)
  reformaInicial: number;
  rentaMensual: number;
  gastosComAnnual: number;     // comunidad anual
  ibiAnual: number;
  seguroHogar: number;         // anual
  seguroImpago: number;        // anual (3-5% renta anual)
  derramaAnual: number;
  mesesVacioAnuales: number;   // 0.5-1 típico
  gastosMantenimiento: number; // anual (regla 1-2% valor inmueble)
  gastosGestion: number;       // anual, 0 si autogestión, 8-12% renta si gestor
  hipotecaMensual: number;     // 0 si compra al contado
  incrementoIpcAnual: number;  // ej: 3 (%)
}

export interface TraditionalRentalResult {
  inversionTotal: number;
  ingresosAnuales: number;
  gastosAnuales: number;
  detalleGastos: { concepto: string; importe: number }[];
  cashFlowAnualBruto: number;
  cashFlowAnualNeto: number;
  cashFlowMensualNeto: number;
  rentBruta: number;
  rentNeta: number;
  rentNetaSobreCapital: number;  // ROE: sobre dinero realmente invertido
  paybackAnos: number;
  proyeccion5anos: { ano: number; renta: number; gastos: number; cashFlow: number; acumulado: number }[];
}

export function calculateTraditionalRental(input: TraditionalRentalInput): TraditionalRentalResult {
  const inversionTotal = input.precioCompra + input.gastosCompra + input.reformaInicial;
  const mesesOcupados = 12 - input.mesesVacioAnuales;
  const ingresosAnuales = input.rentaMensual * mesesOcupados;

  const detalleGastos = [
    { concepto: 'Comunidad', importe: input.gastosComAnnual },
    { concepto: 'IBI', importe: input.ibiAnual },
    { concepto: 'Seguro hogar', importe: input.seguroHogar },
    { concepto: 'Seguro impago', importe: input.seguroImpago },
    { concepto: 'Derramas', importe: input.derramaAnual },
    { concepto: 'Mantenimiento', importe: input.gastosMantenimiento },
    { concepto: 'Gestión', importe: input.gastosGestion },
  ].filter(g => g.importe > 0);

  const gastosAnualesSinHipoteca = detalleGastos.reduce((s, g) => s + g.importe, 0);
  const hipotecaAnual = input.hipotecaMensual * 12;
  const gastosAnuales = gastosAnualesSinHipoteca + hipotecaAnual;

  if (hipotecaAnual > 0) {
    detalleGastos.push({ concepto: 'Hipoteca', importe: hipotecaAnual });
  }

  const cashFlowAnualBruto = ingresosAnuales - gastosAnualesSinHipoteca;
  const cashFlowAnualNeto = ingresosAnuales - gastosAnuales;
  const cashFlowMensualNeto = cashFlowAnualNeto / 12;

  const rentBruta = inversionTotal > 0 ? (input.rentaMensual * 12 / inversionTotal) * 100 : 0;
  const rentNeta = inversionTotal > 0 ? (cashFlowAnualBruto / inversionTotal) * 100 : 0;

  const capitalPropio = inversionTotal - (input.hipotecaMensual > 0 ? input.precioCompra * 0.8 : 0);
  const rentNetaSobreCapital = capitalPropio > 0 ? (cashFlowAnualNeto / capitalPropio) * 100 : 0;

  const paybackAnos = cashFlowAnualNeto > 0 ? inversionTotal / cashFlowAnualNeto : 0;

  const ipc = input.incrementoIpcAnual / 100;
  const proyeccion5anos: TraditionalRentalResult['proyeccion5anos'] = [];
  let acumulado = 0;
  for (let i = 1; i <= 5; i++) {
    const rentaAno = ingresosAnuales * Math.pow(1 + ipc, i - 1);
    const gastosAno = gastosAnuales * Math.pow(1 + ipc * 0.5, i - 1);
    const cf = rentaAno - gastosAno;
    acumulado += cf;
    proyeccion5anos.push({
      ano: i,
      renta: Math.round(rentaAno),
      gastos: Math.round(gastosAno),
      cashFlow: Math.round(cf),
      acumulado: Math.round(acumulado),
    });
  }

  return {
    inversionTotal: Math.round(inversionTotal),
    ingresosAnuales: Math.round(ingresosAnuales),
    gastosAnuales: Math.round(gastosAnuales),
    detalleGastos,
    cashFlowAnualBruto: Math.round(cashFlowAnualBruto),
    cashFlowAnualNeto: Math.round(cashFlowAnualNeto),
    cashFlowMensualNeto: Math.round(cashFlowMensualNeto),
    rentBruta: parseFloat(rentBruta.toFixed(2)),
    rentNeta: parseFloat(rentNeta.toFixed(2)),
    rentNetaSobreCapital: parseFloat(rentNetaSobreCapital.toFixed(2)),
    paybackAnos: parseFloat(paybackAnos.toFixed(1)),
    proyeccion5anos,
  };
}

// ============================================================================
// CALCULADORA ALQUILER POR HABITACIONES
// ============================================================================

export interface RoomRentalInput {
  precioCompra: number;
  gastosCompra: number;
  reformaInicial: number;
  amueblamiento: number;           // inversión en muebles total
  habitaciones: { renta: number }[];  // renta por habitación
  ocupacionMedia: number;           // 0-100 (%)
  suministrosMensuales: number;     // electricidad, agua, internet
  limpiezaMensual: number;
  gastosComAnnual: number;
  ibiAnual: number;
  seguroHogar: number;
  seguroImpago: number;
  mantenimientoAnual: number;
  gastosGestionAnual: number;
  hipotecaMensual: number;
  rotacionAnual: number;            // nº cambios inquilino/año estimados
  costeRotacionPorCambio: number;   // limpieza profunda, pequeñas reparaciones
}

export interface RoomRentalResult {
  inversionTotal: number;
  numHabitaciones: number;
  rentaTotalMensual: number;
  rentaEfectivaMensual: number;    // ajustada por ocupación
  ingresosAnuales: number;
  gastosAnuales: number;
  detalleGastos: { concepto: string; importe: number }[];
  cashFlowAnualNeto: number;
  cashFlowMensualNeto: number;
  cashFlowPorHabitacion: number;
  rentBruta: number;
  rentNeta: number;
  rentNetaSobreCapital: number;
  paybackAnos: number;
  comparativaVsTradicional: {
    rentaTradicionalEstimada: number;
    diferenciaAnual: number;
    premiumHabitaciones: number;    // % más que alquiler tradicional
  };
}

export function calculateRoomRental(input: RoomRentalInput): RoomRentalResult {
  const inversionTotal = input.precioCompra + input.gastosCompra + input.reformaInicial + input.amueblamiento;
  const numHabitaciones = input.habitaciones.length;
  const rentaTotalMensual = input.habitaciones.reduce((s, h) => s + h.renta, 0);
  const ocupacion = input.ocupacionMedia / 100;
  const rentaEfectivaMensual = rentaTotalMensual * ocupacion;
  const ingresosAnuales = rentaEfectivaMensual * 12;

  const costeRotacion = input.rotacionAnual * input.costeRotacionPorCambio;

  const detalleGastos = [
    { concepto: 'Comunidad', importe: input.gastosComAnnual },
    { concepto: 'IBI', importe: input.ibiAnual },
    { concepto: 'Seguro hogar', importe: input.seguroHogar },
    { concepto: 'Seguro impago', importe: input.seguroImpago },
    { concepto: 'Suministros', importe: input.suministrosMensuales * 12 },
    { concepto: 'Limpieza', importe: input.limpiezaMensual * 12 },
    { concepto: 'Mantenimiento', importe: input.mantenimientoAnual },
    { concepto: 'Gestión', importe: input.gastosGestionAnual },
    { concepto: 'Rotación inquilinos', importe: costeRotacion },
  ].filter(g => g.importe > 0);

  const gastosAnualesSinHipoteca = detalleGastos.reduce((s, g) => s + g.importe, 0);
  const hipotecaAnual = input.hipotecaMensual * 12;
  const gastosAnuales = gastosAnualesSinHipoteca + hipotecaAnual;

  if (hipotecaAnual > 0) {
    detalleGastos.push({ concepto: 'Hipoteca', importe: hipotecaAnual });
  }

  const cashFlowAnualNeto = ingresosAnuales - gastosAnuales;
  const cashFlowMensualNeto = cashFlowAnualNeto / 12;
  const cashFlowPorHabitacion = numHabitaciones > 0 ? cashFlowMensualNeto / numHabitaciones : 0;

  const rentBruta = inversionTotal > 0 ? (rentaTotalMensual * 12 / inversionTotal) * 100 : 0;
  const rentNeta = inversionTotal > 0 ? ((ingresosAnuales - gastosAnualesSinHipoteca) / inversionTotal) * 100 : 0;
  const capitalPropio = inversionTotal - (input.hipotecaMensual > 0 ? input.precioCompra * 0.8 : 0);
  const rentNetaSobreCapital = capitalPropio > 0 ? (cashFlowAnualNeto / capitalPropio) * 100 : 0;
  const paybackAnos = cashFlowAnualNeto > 0 ? inversionTotal / cashFlowAnualNeto : 0;

  const rentaTradicionalEstimada = rentaTotalMensual * 0.6;
  const diferenciaAnual = (rentaEfectivaMensual - rentaTradicionalEstimada) * 12;
  const premiumHabitaciones = rentaTradicionalEstimada > 0
    ? ((rentaEfectivaMensual - rentaTradicionalEstimada) / rentaTradicionalEstimada) * 100
    : 0;

  return {
    inversionTotal: Math.round(inversionTotal),
    numHabitaciones,
    rentaTotalMensual: Math.round(rentaTotalMensual),
    rentaEfectivaMensual: Math.round(rentaEfectivaMensual),
    ingresosAnuales: Math.round(ingresosAnuales),
    gastosAnuales: Math.round(gastosAnuales),
    detalleGastos,
    cashFlowAnualNeto: Math.round(cashFlowAnualNeto),
    cashFlowMensualNeto: Math.round(cashFlowMensualNeto),
    cashFlowPorHabitacion: Math.round(cashFlowPorHabitacion),
    rentBruta: parseFloat(rentBruta.toFixed(2)),
    rentNeta: parseFloat(rentNeta.toFixed(2)),
    rentNetaSobreCapital: parseFloat(rentNetaSobreCapital.toFixed(2)),
    paybackAnos: parseFloat(paybackAnos.toFixed(1)),
    comparativaVsTradicional: {
      rentaTradicionalEstimada: Math.round(rentaTradicionalEstimada),
      diferenciaAnual: Math.round(diferenciaAnual),
      premiumHabitaciones: parseFloat(premiumHabitaciones.toFixed(1)),
    },
  };
}

// ============================================================================
// CALCULADORA ALQUILER TURÍSTICO
// ============================================================================

export interface TouristRentalInput {
  precioCompra: number;
  gastosCompra: number;
  reformaInicial: number;
  amueblamiento: number;
  licenciaTuristica: number;         // coste obtención
  fotografiaProfesional: number;
  tarifaAltaNoche: number;
  tarifaMediaNoche: number;
  tarifaBajaNoche: number;
  ocupacionAlta: number;             // % (ej: julio-agosto-sept)
  ocupacionMedia: number;            // % (ej: primavera, navidad)
  ocupacionBaja: number;             // % (ej: nov-feb)
  mesesAlta: number;                 // ej: 3
  mesesMedia: number;                // ej: 5
  mesesBaja: number;                 // ej: 4
  comisionPlataforma: number;        // % (Airbnb 3%, Booking 15%)
  limpiezaPorEstancia: number;       // coste
  estanciaMediaNoches: number;       // noches por reserva
  amenitiesMensual: number;          // consumibles, sábanas, etc.
  channelManagerMensual: number;
  gastosComAnnual: number;
  ibiAnual: number;
  seguroHogar: number;
  mantenimientoAnual: number;
  hipotecaMensual: number;
}

export interface TouristRentalResult {
  inversionTotal: number;
  ingresosAnualesBrutos: number;
  comisionesPlataforma: number;
  ingresosAnualesNetos: number;
  gastosAnuales: number;
  detalleGastos: { concepto: string; importe: number }[];
  cashFlowAnualNeto: number;
  cashFlowMensualNeto: number;
  revPAR: number;                   // Revenue Per Available Room (noche)
  adr: number;                      // Average Daily Rate
  ocupacionMediaAnual: number;      // % ponderado
  nochesOcupadasAnuales: number;
  numEstanciasAnuales: number;
  costeTotal360: number;            // coste total anual incluyendo limpieza
  rentBruta: number;
  rentNeta: number;
  desgloseMensual: { mes: string; ingresos: number; gastos: number; cashFlow: number }[];
}

export function calculateTouristRental(input: TouristRentalInput): TouristRentalResult {
  const inversionTotal = input.precioCompra + input.gastosCompra + input.reformaInicial
    + input.amueblamiento + input.licenciaTuristica + input.fotografiaProfesional;

  const nochesAlta = input.mesesAlta * 30 * (input.ocupacionAlta / 100);
  const nochesMedia = input.mesesMedia * 30 * (input.ocupacionMedia / 100);
  const nochesBaja = input.mesesBaja * 30 * (input.ocupacionBaja / 100);
  const nochesOcupadasAnuales = nochesAlta + nochesMedia + nochesBaja;

  const ingresosAlta = nochesAlta * input.tarifaAltaNoche;
  const ingresosMedia = nochesMedia * input.tarifaMediaNoche;
  const ingresosBaja = nochesBaja * input.tarifaBajaNoche;
  const ingresosAnualesBrutos = ingresosAlta + ingresosMedia + ingresosBaja;

  const comisionesPlataforma = ingresosAnualesBrutos * (input.comisionPlataforma / 100);
  const ingresosAnualesNetos = ingresosAnualesBrutos - comisionesPlataforma;

  const numEstancias = input.estanciaMediaNoches > 0 ? nochesOcupadasAnuales / input.estanciaMediaNoches : 0;
  const limpiezaAnual = numEstancias * input.limpiezaPorEstancia;

  const detalleGastos = [
    { concepto: 'Comunidad', importe: input.gastosComAnnual },
    { concepto: 'IBI', importe: input.ibiAnual },
    { concepto: 'Seguro hogar', importe: input.seguroHogar },
    { concepto: 'Mantenimiento', importe: input.mantenimientoAnual },
    { concepto: 'Limpieza estancias', importe: Math.round(limpiezaAnual) },
    { concepto: 'Amenities/consumibles', importe: input.amenitiesMensual * 12 },
    { concepto: 'Channel Manager', importe: input.channelManagerMensual * 12 },
  ].filter(g => g.importe > 0);

  const gastosAnualesSinHipoteca = detalleGastos.reduce((s, g) => s + g.importe, 0);
  const hipotecaAnual = input.hipotecaMensual * 12;
  const gastosAnuales = gastosAnualesSinHipoteca + hipotecaAnual;

  if (hipotecaAnual > 0) {
    detalleGastos.push({ concepto: 'Hipoteca', importe: hipotecaAnual });
  }

  const cashFlowAnualNeto = ingresosAnualesNetos - gastosAnuales;
  const nochesTotales = 365;
  const revPAR = nochesTotales > 0 ? ingresosAnualesNetos / nochesTotales : 0;
  const adr = nochesOcupadasAnuales > 0 ? ingresosAnualesBrutos / nochesOcupadasAnuales : 0;
  const ocupacionMediaAnual = (nochesOcupadasAnuales / nochesTotales) * 100;

  const rentBruta = inversionTotal > 0 ? (ingresosAnualesBrutos / inversionTotal) * 100 : 0;
  const rentNeta = inversionTotal > 0 ? (cashFlowAnualNeto / inversionTotal) * 100 : 0;

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const temporadaPorMes = [
    'baja', 'baja', 'media', 'media', 'media', 'alta',
    'alta', 'alta', 'media', 'media', 'baja', 'baja',
  ];
  const desgloseMensual = meses.map((mes, i) => {
    const temp = temporadaPorMes[i];
    const tarifa = temp === 'alta' ? input.tarifaAltaNoche : temp === 'media' ? input.tarifaMediaNoche : input.tarifaBajaNoche;
    const ocup = temp === 'alta' ? input.ocupacionAlta : temp === 'media' ? input.ocupacionMedia : input.ocupacionBaja;
    const nochesOcup = 30 * (ocup / 100);
    const ingMes = nochesOcup * tarifa * (1 - input.comisionPlataforma / 100);
    const gastosMes = gastosAnuales / 12;
    return { mes, ingresos: Math.round(ingMes), gastos: Math.round(gastosMes), cashFlow: Math.round(ingMes - gastosMes) };
  });

  return {
    inversionTotal: Math.round(inversionTotal),
    ingresosAnualesBrutos: Math.round(ingresosAnualesBrutos),
    comisionesPlataforma: Math.round(comisionesPlataforma),
    ingresosAnualesNetos: Math.round(ingresosAnualesNetos),
    gastosAnuales: Math.round(gastosAnuales),
    detalleGastos,
    cashFlowAnualNeto: Math.round(cashFlowAnualNeto),
    cashFlowMensualNeto: Math.round(cashFlowAnualNeto / 12),
    revPAR: parseFloat(revPAR.toFixed(2)),
    adr: parseFloat(adr.toFixed(2)),
    ocupacionMediaAnual: parseFloat(ocupacionMediaAnual.toFixed(1)),
    nochesOcupadasAnuales: Math.round(nochesOcupadasAnuales),
    numEstanciasAnuales: Math.round(numEstancias),
    costeTotal360: Math.round(gastosAnuales + comisionesPlataforma),
    rentBruta: parseFloat(rentBruta.toFixed(2)),
    rentNeta: parseFloat(rentNeta.toFixed(2)),
    desgloseMensual,
  };
}

// ============================================================================
// CALCULADORA CRV (COMPRAR, REFORMAR, VENDER)
// ============================================================================

export interface FlipInput {
  precioCompra: number;
  gastosCompra: number;           // ITP/IVA + notaría + registro + gestoría
  costeReforma: number;
  tiempoReformaMeses: number;
  costeTenenciaMensual: number;   // IBI prorrateado + comunidad + suministros mínimos
  costeFincMensual: number;       // intereses préstamo durante reforma (si hay)
  precioVenta: number;
  tiempoVentaMeses: number;       // estimado
  comisionInmobiliaria: number;   // % sobre precio venta (3-5%)
  plusvaliaMunicipal: number;      // estimado
  irpfGanancia: number;           // % sobre beneficio (19-23% persona física)
}

export interface FlipResult {
  inversionTotal: number;
  detalleInversion: { concepto: string; importe: number }[];
  precioVentaBruto: number;
  gastosVenta: number;
  detalleGastosVenta: { concepto: string; importe: number }[];
  beneficioAntesTax: number;
  impuestos: number;
  beneficioNeto: number;
  roiSobreCapital: number;        // % beneficio / inversión total
  duracionTotalMeses: number;
  roiAnualizado: number;          // ROI ajustado a 12 meses
  margenSobreVenta: number;       // % beneficio / precio venta
  precioMinVentaBreakEven: number;
}

export function calculateFlip(input: FlipInput): FlipResult {
  const duracionTotal = input.tiempoReformaMeses + input.tiempoVentaMeses;
  const costeTenenciaTotal = input.costeTenenciaMensual * duracionTotal;
  const costeFinancieroTotal = input.costeFincMensual * duracionTotal;

  const inversionTotal = input.precioCompra + input.gastosCompra + input.costeReforma
    + costeTenenciaTotal + costeFinancieroTotal;

  const detalleInversion = [
    { concepto: 'Precio compra', importe: input.precioCompra },
    { concepto: 'Gastos compra (ITP, notaría, etc.)', importe: input.gastosCompra },
    { concepto: 'Reforma', importe: input.costeReforma },
    { concepto: `Tenencia (${duracionTotal} meses)`, importe: Math.round(costeTenenciaTotal) },
    { concepto: `Financiación (${duracionTotal} meses)`, importe: Math.round(costeFinancieroTotal) },
  ];

  const comision = input.precioVenta * (input.comisionInmobiliaria / 100);
  const detalleGastosVenta = [
    { concepto: `Comisión inmobiliaria (${input.comisionInmobiliaria}%)`, importe: Math.round(comision) },
    { concepto: 'Plusvalía municipal', importe: input.plusvaliaMunicipal },
  ];
  const gastosVenta = detalleGastosVenta.reduce((s, g) => s + g.importe, 0);

  const beneficioAntesTax = input.precioVenta - inversionTotal - gastosVenta;
  const impuestos = beneficioAntesTax > 0 ? Math.round(beneficioAntesTax * (input.irpfGanancia / 100)) : 0;
  const beneficioNeto = beneficioAntesTax - impuestos;

  if (impuestos > 0) {
    detalleGastosVenta.push({ concepto: `IRPF ganancia (${input.irpfGanancia}%)`, importe: impuestos });
  }

  const roiSobreCapital = inversionTotal > 0 ? (beneficioNeto / inversionTotal) * 100 : 0;
  const roiAnualizado = duracionTotal > 0 ? roiSobreCapital * (12 / duracionTotal) : 0;
  const margenSobreVenta = input.precioVenta > 0 ? (beneficioNeto / input.precioVenta) * 100 : 0;

  const precioMinVentaBreakEven = inversionTotal + gastosVenta;

  return {
    inversionTotal: Math.round(inversionTotal),
    detalleInversion,
    precioVentaBruto: input.precioVenta,
    gastosVenta: Math.round(gastosVenta + impuestos),
    detalleGastosVenta,
    beneficioAntesTax: Math.round(beneficioAntesTax),
    impuestos,
    beneficioNeto: Math.round(beneficioNeto),
    roiSobreCapital: parseFloat(roiSobreCapital.toFixed(2)),
    duracionTotalMeses: duracionTotal,
    roiAnualizado: parseFloat(roiAnualizado.toFixed(2)),
    margenSobreVenta: parseFloat(margenSobreVenta.toFixed(2)),
    precioMinVentaBreakEven: Math.round(precioMinVentaBreakEven),
  };
}

// ============================================================================
// P&L POR INMUEBLE (CUENTA DE RESULTADOS)
// ============================================================================

export interface PropertyPnLInput {
  periodoMeses: number;            // 12 para anual
  ingresos: {
    rentaMensual: number;
    mesesOcupado: number;
    otrosIngresos: number;         // garaje, trastero, etc.
  };
  gastosFijos: {
    hipoteca: number;              // mensual
    comunidad: number;             // mensual
    ibi: number;                   // anual
    seguroHogar: number;           // anual
    seguroImpago: number;          // anual
  };
  gastosVariables: {
    reparaciones: number;          // en el periodo
    gestion: number;               // en el periodo
    suministros: number;           // en el periodo (si los paga propietario)
    derramas: number;              // en el periodo
    otros: number;
  };
}

export interface PropertyPnLResult {
  totalIngresos: number;
  totalGastosFijos: number;
  totalGastosVariables: number;
  totalGastos: number;
  ebitda: number;                  // antes de hipoteca
  cashFlowNeto: number;            // después de hipoteca
  margenOperativo: number;         // % ebitda/ingresos
  detalleIngresos: { concepto: string; importe: number }[];
  detalleGastos: { concepto: string; importe: number; tipo: 'fijo' | 'variable' }[];
}

export function calculatePropertyPnL(input: PropertyPnLInput): PropertyPnLResult {
  const totalRenta = input.ingresos.rentaMensual * input.ingresos.mesesOcupado;
  const totalIngresos = totalRenta + input.ingresos.otrosIngresos;

  const detalleIngresos = [
    { concepto: `Renta (${input.ingresos.mesesOcupado} meses)`, importe: totalRenta },
  ];
  if (input.ingresos.otrosIngresos > 0) {
    detalleIngresos.push({ concepto: 'Otros ingresos', importe: input.ingresos.otrosIngresos });
  }

  const gastosFijosAnualizados = [
    { concepto: 'Comunidad', importe: input.gastosFijos.comunidad * input.periodoMeses, tipo: 'fijo' as const },
    { concepto: 'IBI', importe: input.gastosFijos.ibi, tipo: 'fijo' as const },
    { concepto: 'Seguro hogar', importe: input.gastosFijos.seguroHogar, tipo: 'fijo' as const },
    { concepto: 'Seguro impago', importe: input.gastosFijos.seguroImpago, tipo: 'fijo' as const },
  ].filter(g => g.importe > 0);

  const gastosVariablesList = [
    { concepto: 'Reparaciones', importe: input.gastosVariables.reparaciones, tipo: 'variable' as const },
    { concepto: 'Gestión', importe: input.gastosVariables.gestion, tipo: 'variable' as const },
    { concepto: 'Suministros', importe: input.gastosVariables.suministros, tipo: 'variable' as const },
    { concepto: 'Derramas', importe: input.gastosVariables.derramas, tipo: 'variable' as const },
    { concepto: 'Otros', importe: input.gastosVariables.otros, tipo: 'variable' as const },
  ].filter(g => g.importe > 0);

  const totalGastosFijos = gastosFijosAnualizados.reduce((s, g) => s + g.importe, 0);
  const totalGastosVariables = gastosVariablesList.reduce((s, g) => s + g.importe, 0);
  const hipotecaTotal = input.gastosFijos.hipoteca * input.periodoMeses;

  const detalleGastos = [
    ...gastosFijosAnualizados,
    ...gastosVariablesList,
  ];

  if (hipotecaTotal > 0) {
    detalleGastos.push({ concepto: 'Hipoteca', importe: hipotecaTotal, tipo: 'fijo' as const });
  }

  const totalGastos = totalGastosFijos + totalGastosVariables + hipotecaTotal;
  const ebitda = totalIngresos - totalGastosFijos - totalGastosVariables;
  const cashFlowNeto = totalIngresos - totalGastos;
  const margenOperativo = totalIngresos > 0 ? (ebitda / totalIngresos) * 100 : 0;

  return {
    totalIngresos: Math.round(totalIngresos),
    totalGastosFijos: Math.round(totalGastosFijos),
    totalGastosVariables: Math.round(totalGastosVariables),
    totalGastos: Math.round(totalGastos),
    ebitda: Math.round(ebitda),
    cashFlowNeto: Math.round(cashFlowNeto),
    margenOperativo: parseFloat(margenOperativo.toFixed(1)),
    detalleIngresos,
    detalleGastos,
  };
}

// ============================================================================
// CHECKLIST DE VISITA DE INMUEBLE
// ============================================================================

export interface InspectionItem {
  id: string;
  text: string;
  category: string;
  critical: boolean;
  hint?: string;
}

export function getPropertyInspectionChecklist(): InspectionItem[] {
  return [
    // Estructura del edificio
    { id: 'fachada', text: 'Estado de la fachada (grietas, humedades, desconchones)', category: 'Edificio', critical: true },
    { id: 'bajantes', text: 'Bajantes visibles (material, estado, manchas)', category: 'Edificio', critical: false },
    { id: 'cubierta', text: 'Cubierta/tejado (filtraciones)', category: 'Edificio', critical: true },
    { id: 'portal', text: 'Estado del portal y zonas comunes', category: 'Edificio', critical: false },
    { id: 'ascensor', text: 'Ascensor (año, última revisión)', category: 'Edificio', critical: false },
    { id: 'ite', text: 'ITE del edificio (si >50 años)', category: 'Edificio', critical: true, hint: 'Pedir informe al administrador' },

    // Interior
    { id: 'electrica', text: 'Instalación eléctrica (cuadro, tomas de tierra, boletín)', category: 'Interior', critical: true, hint: 'Si no hay boletín actualizado: ~800-1500€' },
    { id: 'fontaneria', text: 'Fontanería (material tuberías, presión agua)', category: 'Interior', critical: true, hint: 'Plomo = reforma obligatoria. Cobre/PVC = OK' },
    { id: 'humedades', text: 'Humedades (paredes, techos, bajo ventanas, baños)', category: 'Interior', critical: true },
    { id: 'carpinteria', text: 'Carpintería exterior (ventanas, aislamiento)', category: 'Interior', critical: false, hint: 'Aluminio sin RPT = mal aislamiento' },
    { id: 'suelos', text: 'Suelos (material, estado, nivelación)', category: 'Interior', critical: false },
    { id: 'cocina', text: 'Cocina (estado muebles, electrodomésticos)', category: 'Interior', critical: false },
    { id: 'banos', text: 'Baños (grifería, sanitarios, impermeabilización)', category: 'Interior', critical: false },
    { id: 'caldera', text: 'Caldera/Termo (tipo, año, última revisión)', category: 'Interior', critical: false },
    { id: 'aislamiento', text: 'Aislamiento térmico y acústico', category: 'Interior', critical: false },

    // Documentación
    { id: 'doc-nota', text: 'Nota simple actualizada (cargas, titularidad)', category: 'Documentación', critical: true },
    { id: 'doc-catastro', text: 'Referencia catastral (superficie catastral vs real)', category: 'Documentación', critical: true },
    { id: 'doc-ibi', text: 'Último recibo IBI (importe, valor catastral)', category: 'Documentación', critical: true },
    { id: 'doc-cee', text: 'Certificado Energético en vigor', category: 'Documentación', critical: true },
    { id: 'doc-acta', text: 'Última acta de comunidad (derramas aprobadas)', category: 'Documentación', critical: true, hint: 'Pedir últimas 3 actas' },
    { id: 'doc-deuda', text: 'Certificado deuda cero con comunidad', category: 'Documentación', critical: true },
    { id: 'doc-recibos', text: 'Recibos comunidad últimos 12 meses', category: 'Documentación', critical: false },
    { id: 'doc-cedula', text: 'Cédula de habitabilidad / licencia primera ocupación', category: 'Documentación', critical: false },

    // Entorno
    { id: 'entorno-transp', text: 'Transporte público cercano', category: 'Entorno', critical: false },
    { id: 'entorno-serv', text: 'Servicios (supermercados, colegios, sanidad)', category: 'Entorno', critical: false },
    { id: 'entorno-zona', text: 'Tendencia de precios del barrio', category: 'Entorno', critical: true, hint: 'Consultar Idealista data o Catastro' },
    { id: 'entorno-comp', text: 'Competencia: inmuebles similares en alquiler/venta', category: 'Entorno', critical: true },
    { id: 'entorno-reg', text: 'Regulación local (zona tensionada, licencia turística)', category: 'Entorno', critical: true },
  ];
}

// ============================================================================
// PORTFOLIO IMPACT
// ============================================================================

export interface PortfolioImpact {
  currentYield: number;
  newYield: number;
  yieldChange: number;
  currentUnits: number;
  newUnits: number;
  diversificationChange: string;
  concentrationRisk: string;
}

export function calculatePortfolioImpact(
  portfolio: { totalUnits: number; avgYield: number; monthlyRent: number; byType?: Record<string, number> },
  newOpp: { estimatedYield: number; price: number; location: string; propertyType: string }
): PortfolioImpact {
  const currentYield = parseFloat(portfolio.avgYield?.toString() || '0');
  const currentUnits = portfolio.totalUnits || 0;

  // Weighted average yield
  const newYield = currentUnits > 0
    ? (currentYield * currentUnits + (newOpp.estimatedYield || 0)) / (currentUnits + 1)
    : newOpp.estimatedYield || 0;

  const yieldChange = newYield - currentYield;

  // Diversification: check if this adds a new type
  const existingTypes = Object.keys(portfolio.byType || {});
  const addsNewType = !existingTypes.includes(newOpp.propertyType);
  const diversificationChange = addsNewType ? 'Mejora (nuevo tipo de activo)' : 'Sin cambio';

  // Concentration: if >50% in one location, warn
  const concentrationRisk = currentUnits > 5 ? 'Revisar concentración geográfica' : 'Aceptable';

  return {
    currentYield,
    newYield: parseFloat(newYield.toFixed(2)),
    yieldChange: parseFloat(yieldChange.toFixed(2)),
    currentUnits,
    newUnits: currentUnits + 1,
    diversificationChange,
    concentrationRisk,
  };
}

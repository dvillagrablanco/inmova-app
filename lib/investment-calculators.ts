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

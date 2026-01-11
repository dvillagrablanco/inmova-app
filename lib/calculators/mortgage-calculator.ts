/**
 * Calculadora de Hipoteca
 * 
 * Simula cuotas, TAE y tabla de amortización
 * para préstamos hipotecarios fijos, variables y mixtos.
 */

export interface MortgageInput {
  /** Precio del inmueble (€) */
  propertyPrice: number;
  /** Porcentaje de entrada (%) */
  downPaymentPercent: number;
  /** Tipo de interés nominal anual (%) */
  interestRate: number;
  /** Plazo en años */
  termYears: number;
  /** Tipo de hipoteca */
  type: 'FIXED' | 'VARIABLE' | 'MIXED';
  /** Euribor actual (%) - para variable/mixta */
  euribor?: number;
  /** Diferencial sobre Euribor (%) - para variable/mixta */
  differential?: number;
  /** Años a tipo fijo - para mixta */
  fixedPeriodYears?: number;
  /** Comisión de apertura (%) */
  openingFee?: number;
  /** Coste tasación (€) */
  appraisalCost?: number;
  /** Coste notaría (€) */
  notaryCost?: number;
  /** Coste gestoría (€) */
  agencyCost?: number;
}

export interface AmortizationRow {
  /** Número de cuota */
  month: number;
  /** Año */
  year: number;
  /** Cuota mensual (€) */
  payment: number;
  /** Principal amortizado (€) */
  principal: number;
  /** Intereses (€) */
  interest: number;
  /** Capital pendiente (€) */
  balance: number;
  /** Principal acumulado (€) */
  cumulativePrincipal: number;
  /** Intereses acumulados (€) */
  cumulativeInterest: number;
}

export interface MortgageOutput {
  /** Importe del préstamo (€) */
  loanAmount: number;
  /** Entrada (€) */
  downPayment: number;
  /** Cuota mensual (€) */
  monthlyPayment: number;
  /** Pago total a lo largo de la vida del préstamo (€) */
  totalPayment: number;
  /** Total intereses pagados (€) */
  totalInterest: number;
  /** TAE aproximada (%) */
  tae: number;
  /** Ratio préstamo/valor (LTV) */
  ltv: number;
  /** Tabla de amortización */
  amortizationTable: AmortizationRow[];
  /** Resumen por años */
  yearlyBreakdown: {
    year: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
  /** Gastos iniciales (€) */
  initialCosts: number;
  /** Coste total real (€) - incluye gastos */
  totalRealCost: number;
}

/**
 * Calcula la cuota mensual de una hipoteca (sistema francés)
 */
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) {
    return principal / months;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  return principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
}

/**
 * Calcula todos los detalles de una hipoteca
 */
export function calculateMortgage(input: MortgageInput): MortgageOutput {
  // Cálculos básicos
  const downPayment = input.propertyPrice * (input.downPaymentPercent / 100);
  const loanAmount = input.propertyPrice - downPayment;
  const ltv = (loanAmount / input.propertyPrice) * 100;
  
  // Tipo de interés efectivo
  let effectiveRate: number;
  switch (input.type) {
    case 'VARIABLE':
      effectiveRate = (input.euribor || 0) + (input.differential || 0);
      break;
    case 'MIXED':
      // Para cálculo inicial, usar tasa fija
      effectiveRate = input.interestRate;
      break;
    default:
      effectiveRate = input.interestRate;
  }
  
  const numPayments = input.termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, effectiveRate, numPayments);
  
  // Generar tabla de amortización
  const amortizationTable: AmortizationRow[] = [];
  let balance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const monthlyRate = effectiveRate / 100 / 12;
  
  for (let month = 1; month <= numPayments; month++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    cumulativePrincipal += principal;
    cumulativeInterest += interest;
    
    amortizationTable.push({
      month,
      year: Math.ceil(month / 12),
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
    });
  }
  
  // Resumen por años
  const yearlyBreakdown: MortgageOutput['yearlyBreakdown'] = [];
  for (let year = 1; year <= input.termYears; year++) {
    const yearRows = amortizationTable.filter(row => row.year === year);
    const yearPrincipal = yearRows.reduce((sum, row) => sum + row.principal, 0);
    const yearInterest = yearRows.reduce((sum, row) => sum + row.interest, 0);
    const yearEndBalance = yearRows[yearRows.length - 1]?.balance || 0;
    
    yearlyBreakdown.push({
      year,
      principal: Math.round(yearPrincipal * 100) / 100,
      interest: Math.round(yearInterest * 100) / 100,
      balance: Math.round(yearEndBalance * 100) / 100,
    });
  }
  
  // Totales
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;
  
  // Gastos iniciales
  const openingFeeAmount = loanAmount * ((input.openingFee || 0) / 100);
  const initialCosts = 
    openingFeeAmount + 
    (input.appraisalCost || 0) + 
    (input.notaryCost || 0) + 
    (input.agencyCost || 0);
  
  // TAE aproximada (simplificada)
  const totalRealCost = totalPayment + initialCosts;
  const tae = ((Math.pow(totalRealCost / loanAmount, 1 / input.termYears) - 1) * 100);
  
  return {
    loanAmount,
    downPayment,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    tae: Math.round(tae * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    amortizationTable,
    yearlyBreakdown,
    initialCosts: Math.round(initialCosts * 100) / 100,
    totalRealCost: Math.round(totalRealCost * 100) / 100,
  };
}

/**
 * Calcula cuánto podrías pedir prestado dado un pago mensual máximo
 */
export function calculateMaxLoan(
  maxMonthlyPayment: number,
  interestRate: number,
  termYears: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return maxMonthlyPayment * numPayments;
  }
  
  const maxLoan = maxMonthlyPayment * 
    (Math.pow(1 + monthlyRate, numPayments) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  
  return Math.round(maxLoan * 100) / 100;
}

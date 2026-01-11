/**
 * Calculadora de Rentabilidad de Alquiler
 * 
 * Calcula ROI, rentabilidad bruta/neta, cashflow y payback period
 * para inversiones en alquiler tradicional.
 */

export interface RentalYieldInput {
  /** Precio de compra del inmueble */
  purchasePrice: number;
  /** Coste de reforma/rehabilitación */
  renovationCost: number;
  /** Gastos de compra (notaría, registro, ITP/IVA) */
  closingCosts: number;
  /** Alquiler mensual */
  monthlyRent: number;
  /** Gastos anuales del propietario */
  annualExpenses: {
    /** IBI anual */
    ibi: number;
    /** Cuota comunidad mensual */
    communityFees: number;
    /** Seguro hogar anual */
    insurance: number;
    /** Reserva mantenimiento (% del alquiler anual, ej: 5-10) */
    maintenanceReserve: number;
    /** Gestión/administración (% del alquiler, ej: 8-10) */
    managementFee: number;
    /** Tasa de vacío (% del año, ej: 5 = medio mes vacío) */
    vacancyRate: number;
  };
  /** Datos de financiación (opcional) */
  financing?: {
    /** Importe del préstamo */
    loanAmount: number;
    /** Tipo de interés anual (%) */
    interestRate: number;
    /** Plazo en años */
    termYears: number;
  };
}

export interface RentalYieldOutput {
  /** Rentabilidad bruta (%) - Alquiler anual / Inversión total */
  grossYield: number;
  /** Rentabilidad neta (%) - NOI / Inversión total */
  netYield: number;
  /** Retorno sobre capital invertido (%) - Cashflow / Capital propio */
  cashOnCashReturn: number;
  /** Cashflow mensual (€) */
  monthlyCashflow: number;
  /** Cashflow anual (€) */
  annualCashflow: number;
  /** Años para recuperar inversión */
  paybackYears: number;
  /** Cap Rate (%) - NOI / Precio compra */
  capRate: number;
  /** Inversión total (€) */
  totalInvestment: number;
  /** Ingresos anuales efectivos (€) */
  annualIncome: number;
  /** Gastos anuales totales (€) */
  annualExpenses: number;
  /** Net Operating Income (€) */
  noi: number;
  /** Cuota hipoteca mensual (€) - si aplica */
  monthlyMortgage?: number;
  /** Capital propio invertido (€) */
  cashInvested: number;
  /** Desglose de gastos */
  expenseBreakdown: {
    ibi: number;
    community: number;
    insurance: number;
    maintenance: number;
    management: number;
    vacancy: number;
    total: number;
  };
}

/**
 * Calcula la rentabilidad de una inversión en alquiler
 */
export function calculateRentalYield(input: RentalYieldInput): RentalYieldOutput {
  // Inversión total
  const totalInvestment = input.purchasePrice + input.renovationCost + input.closingCosts;
  
  // Ingresos anuales
  const annualRent = input.monthlyRent * 12;
  const vacancyLoss = annualRent * (input.annualExpenses.vacancyRate / 100);
  const effectiveRent = annualRent - vacancyLoss;
  
  // Gastos anuales
  const maintenanceCost = effectiveRent * (input.annualExpenses.maintenanceReserve / 100);
  const managementCost = effectiveRent * (input.annualExpenses.managementFee / 100);
  const communityCost = input.annualExpenses.communityFees * 12;
  
  const totalAnnualExpenses = 
    input.annualExpenses.ibi +
    communityCost +
    input.annualExpenses.insurance +
    maintenanceCost +
    managementCost;
  
  // NOI (Net Operating Income)
  const noi = effectiveRent - totalAnnualExpenses;
  
  // Hipoteca (si aplica)
  let annualMortgage = 0;
  let monthlyMortgage = 0;
  let cashInvested = totalInvestment;
  
  if (input.financing && input.financing.loanAmount > 0) {
    const monthlyRate = input.financing.interestRate / 100 / 12;
    const numPayments = input.financing.termYears * 12;
    
    if (monthlyRate > 0) {
      monthlyMortgage = input.financing.loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyMortgage = input.financing.loanAmount / numPayments;
    }
    
    annualMortgage = monthlyMortgage * 12;
    cashInvested = totalInvestment - input.financing.loanAmount;
  }
  
  // Cashflow
  const annualCashflow = noi - annualMortgage;
  const monthlyCashflow = annualCashflow / 12;
  
  // Rentabilidades
  const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  const netYield = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
  const cashOnCashReturn = cashInvested > 0 ? (annualCashflow / cashInvested) * 100 : 0;
  const capRate = input.purchasePrice > 0 ? (noi / input.purchasePrice) * 100 : 0;
  
  // Payback
  const paybackYears = annualCashflow > 0 ? cashInvested / annualCashflow : Infinity;
  
  return {
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    monthlyCashflow: Math.round(monthlyCashflow * 100) / 100,
    annualCashflow: Math.round(annualCashflow * 100) / 100,
    paybackYears: Math.round(paybackYears * 10) / 10,
    capRate: Math.round(capRate * 100) / 100,
    totalInvestment,
    annualIncome: Math.round(effectiveRent * 100) / 100,
    annualExpenses: Math.round(totalAnnualExpenses * 100) / 100,
    noi: Math.round(noi * 100) / 100,
    monthlyMortgage: monthlyMortgage > 0 ? Math.round(monthlyMortgage * 100) / 100 : undefined,
    cashInvested,
    expenseBreakdown: {
      ibi: input.annualExpenses.ibi,
      community: communityCost,
      insurance: input.annualExpenses.insurance,
      maintenance: Math.round(maintenanceCost * 100) / 100,
      management: Math.round(managementCost * 100) / 100,
      vacancy: Math.round(vacancyLoss * 100) / 100,
      total: Math.round(totalAnnualExpenses * 100) / 100,
    },
  };
}

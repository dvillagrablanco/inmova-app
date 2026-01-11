/**
 * Calculadora de Flipping / Reforma
 * 
 * Calcula la rentabilidad de operaciones de compra-reforma-venta
 * incluyendo todos los costes asociados.
 */

export interface FlipInput {
  /** Precio de compra del inmueble (€) */
  purchasePrice: number;
  /** Gastos de compra */
  purchaseCosts: {
    /** ITP o IVA (€) */
    transferTax: number;
    /** Notaría (€) */
    notary: number;
    /** Registro (€) */
    registry: number;
    /** Agencia/intermediario (€) */
    agency: number;
    /** Gestoría (€) */
    gestoria: number;
  };
  /** Presupuesto de reforma (€) */
  renovationBudget: number;
  /** Contingencia reforma (%, ej: 10-15) */
  renovationContingency: number;
  /** Costes de tenencia durante la obra/venta */
  holdingCosts: {
    /** Meses de reforma */
    monthsToRenovate: number;
    /** Meses para vender */
    monthsToSell: number;
    /** Suministros mensuales (€) */
    utilities: number;
    /** Seguro mensual (€) */
    insurance: number;
    /** IBI prorrateado mensual (€) */
    propertyTax: number;
    /** Comunidad mensual (€) */
    communityFees: number;
  };
  /** Precio de venta esperado (€) */
  sellingPrice: number;
  /** Gastos de venta */
  sellingCosts: {
    /** Comisión agencia (%) */
    agencyFeePercent: number;
    /** Plusvalía municipal estimada (€) */
    plusvalia: number;
    /** Home staging (€) */
    homeStaging: number;
    /** Marketing/fotografía (€) */
    marketing: number;
  };
  /** Financiación (opcional) */
  financing?: {
    /** Importe del préstamo (€) */
    loanAmount: number;
    /** Tipo de interés anual (%) */
    interestRate: number;
    /** Gastos de apertura (€) */
    openingCosts: number;
    /** Gastos de cancelación (€) */
    cancellationCosts: number;
  };
}

export interface FlipOutput {
  /** Inversión total (€) */
  totalInvestment: number;
  /** Capital propio necesario (€) */
  cashRequired: number;
  /** Beneficio bruto (€) */
  grossProfit: number;
  /** Beneficio neto (€) */
  netProfit: number;
  /** ROI sobre inversión total (%) */
  roi: number;
  /** ROI sobre capital propio (%) */
  roiOnCash: number;
  /** ROI anualizado (%) */
  annualizedRoi: number;
  /** Margen de beneficio (%) */
  profitMargin: number;
  /** Precio de break-even (€) */
  breakEvenPrice: number;
  /** Duración total del proyecto (meses) */
  projectDuration: number;
  /** Desglose de costes */
  costBreakdown: {
    purchase: number;
    purchaseCosts: number;
    renovation: number;
    holding: number;
    selling: number;
    financing: number;
    taxes: number;
    total: number;
  };
  /** IRPF estimado sobre ganancia (€) */
  estimatedTax: number;
  /** Beneficio neto después de impuestos (€) */
  netProfitAfterTax: number;
  /** Métricas de riesgo */
  riskMetrics: {
    /** Margen de seguridad (%) - cuánto puede bajar el precio de venta */
    safetyMargin: number;
    /** Precio mínimo para no perder (€) */
    minimumPrice: number;
    /** Coste mensual de tenencia (€) */
    monthlyHoldingCost: number;
  };
}

/**
 * Calcula la rentabilidad de una operación de flipping
 */
export function calculateFlip(input: FlipInput): FlipOutput {
  // 1. COSTES DE COMPRA
  const purchaseCostsTotal = 
    input.purchaseCosts.transferTax +
    input.purchaseCosts.notary +
    input.purchaseCosts.registry +
    input.purchaseCosts.agency +
    input.purchaseCosts.gestoria;
  
  const totalPurchase = input.purchasePrice + purchaseCostsTotal;
  
  // 2. COSTES DE REFORMA
  const renovationWithContingency = input.renovationBudget * (1 + input.renovationContingency / 100);
  
  // 3. COSTES DE TENENCIA
  const totalMonths = input.holdingCosts.monthsToRenovate + input.holdingCosts.monthsToSell;
  const monthlyHoldingCost = 
    input.holdingCosts.utilities +
    input.holdingCosts.insurance +
    input.holdingCosts.propertyTax +
    input.holdingCosts.communityFees;
  
  const holdingTotal = monthlyHoldingCost * totalMonths;
  
  // 4. COSTES DE VENTA
  const agencyFee = input.sellingPrice * (input.sellingCosts.agencyFeePercent / 100);
  const sellingCostsTotal = 
    agencyFee +
    input.sellingCosts.homeStaging +
    input.sellingCosts.marketing;
  
  // 5. IMPUESTOS
  const plusvalia = input.sellingCosts.plusvalia;
  
  // 6. FINANCIACIÓN
  let financingCosts = 0;
  let loanAmount = 0;
  
  if (input.financing && input.financing.loanAmount > 0) {
    loanAmount = input.financing.loanAmount;
    const monthlyInterest = loanAmount * (input.financing.interestRate / 100 / 12);
    financingCosts = 
      (monthlyInterest * totalMonths) +
      input.financing.openingCosts +
      input.financing.cancellationCosts;
  }
  
  // TOTALES
  const totalCosts = 
    totalPurchase +
    renovationWithContingency +
    holdingTotal +
    sellingCostsTotal +
    plusvalia +
    financingCosts;
  
  const cashRequired = totalCosts - loanAmount;
  
  // BENEFICIOS
  const grossProfit = input.sellingPrice - input.purchasePrice - renovationWithContingency;
  const netProfit = input.sellingPrice - totalCosts;
  
  // IRPF sobre ganancia patrimonial (estimación)
  let estimatedTax = 0;
  if (netProfit > 0) {
    // Tipos 2024: 19% hasta 6k, 21% 6k-50k, 23% 50k-200k, 26% >200k
    if (netProfit <= 6000) {
      estimatedTax = netProfit * 0.19;
    } else if (netProfit <= 50000) {
      estimatedTax = 6000 * 0.19 + (netProfit - 6000) * 0.21;
    } else if (netProfit <= 200000) {
      estimatedTax = 6000 * 0.19 + 44000 * 0.21 + (netProfit - 50000) * 0.23;
    } else {
      estimatedTax = 6000 * 0.19 + 44000 * 0.21 + 150000 * 0.23 + (netProfit - 200000) * 0.26;
    }
  }
  
  const netProfitAfterTax = netProfit - estimatedTax;
  
  // RENTABILIDADES
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  const roiOnCash = cashRequired > 0 ? (netProfit / cashRequired) * 100 : 0;
  const annualizedRoi = totalMonths > 0 ? (roi / totalMonths) * 12 : 0;
  const profitMargin = input.sellingPrice > 0 ? (netProfit / input.sellingPrice) * 100 : 0;
  
  // BREAK-EVEN
  const breakEvenPrice = totalCosts;
  
  // MÉTRICAS DE RIESGO
  const safetyMargin = input.sellingPrice > 0 
    ? ((input.sellingPrice - breakEvenPrice) / input.sellingPrice) * 100 
    : 0;
  
  return {
    totalInvestment: Math.round(totalCosts * 100) / 100,
    cashRequired: Math.round(cashRequired * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    roiOnCash: Math.round(roiOnCash * 100) / 100,
    annualizedRoi: Math.round(annualizedRoi * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
    projectDuration: totalMonths,
    costBreakdown: {
      purchase: input.purchasePrice,
      purchaseCosts: Math.round(purchaseCostsTotal * 100) / 100,
      renovation: Math.round(renovationWithContingency * 100) / 100,
      holding: Math.round(holdingTotal * 100) / 100,
      selling: Math.round(sellingCostsTotal * 100) / 100,
      financing: Math.round(financingCosts * 100) / 100,
      taxes: Math.round(plusvalia * 100) / 100,
      total: Math.round(totalCosts * 100) / 100,
    },
    estimatedTax: Math.round(estimatedTax * 100) / 100,
    netProfitAfterTax: Math.round(netProfitAfterTax * 100) / 100,
    riskMetrics: {
      safetyMargin: Math.round(safetyMargin * 100) / 100,
      minimumPrice: Math.round(breakEvenPrice * 100) / 100,
      monthlyHoldingCost: Math.round(monthlyHoldingCost * 100) / 100,
    },
  };
}

/**
 * Análisis de sensibilidad: calcula ROI para diferentes precios de venta
 */
export function sensitivityAnalysis(
  input: FlipInput,
  priceVariations: number[] = [-20, -15, -10, -5, 0, 5, 10, 15, 20]
): { variation: number; sellingPrice: number; netProfit: number; roi: number }[] {
  return priceVariations.map(variation => {
    const adjustedPrice = input.sellingPrice * (1 + variation / 100);
    const result = calculateFlip({
      ...input,
      sellingPrice: adjustedPrice,
    });
    
    return {
      variation,
      sellingPrice: Math.round(adjustedPrice),
      netProfit: result.netProfit,
      roi: result.roi,
    };
  });
}

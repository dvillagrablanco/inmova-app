/**
 * FLIPPING DEAL ANALYZER
 * Calculadora completa de análisis de deals para proyectos de flipping inmobiliario
 * Incluye: ROI, cash flow, ARV, holding costs, profit margins, sensibilidad
 */

import { addMonths, differenceInMonths } from 'date-fns';

// ========================================
// TIPOS Y INTERFACES
// ========================================

export interface PropertyPurchaseData {
  purchasePrice: number;
  closingCosts?: number; // Costes de cierre (notario, registro, etc.)
  downPayment?: number; // Pago inicial si hay financiación
  loanAmount?: number; // Monto del préstamo
  interestRate?: number; // Tasa de interés anual (%)
  loanTermMonths?: number; // Plazo del préstamo en meses
}

export interface RenovationCosts {
  structural?: number; // Obra estructural
  plumbing?: number; // Fontanería
  electrical?: number; // Electricidad
  hvac?: number; // Climatización
  flooring?: number; // Suelos
  painting?: number; // Pintura
  kitchen?: number; // Cocina
  bathrooms?: number; // Baños
  exterior?: number; // Exterior/jardín
  landscaping?: number; // Paisajismo
  contingency?: number; // Contingencia (10-20% recomendado)
  other?: number; // Otros
}

export interface HoldingCosts {
  propertyTaxes?: number; // IBI mensual
  insurance?: number; // Seguro mensual
  utilities?: number; // Suministros mensuales
  hoaFees?: number; // Cuotas comunidad
  loanPayment?: number; // Pago mensual préstamo
  other?: number; // Otros costes mensuales
}

export interface SellingCosts {
  agentCommission?: number; // Comisión agente (% del precio venta)
  closingCosts?: number; // Costes de cierre venta
  staging?: number; // Home staging
  marketing?: number; // Marketing
  other?: number; // Otros
}

export interface DealAnalysisInput {
  // Compra
  purchase: PropertyPurchaseData;

  // Renovación
  renovation: RenovationCosts;
  renovationTimeMonths: number;

  // Costes de mantenimiento
  holding: HoldingCosts;

  // Venta
  afterRepairValue: number; // ARV - Valor después de reparaciones
  selling: SellingCosts;
  timeToSellMonths?: number; // Tiempo para vender después de renovación
}

export interface DealAnalysisResult {
  // Inversión total
  totalInvestment: number;
  cashNeeded: number; // Efectivo necesario

  // Costes
  totalPurchaseCost: number;
  totalRenovationCost: number;
  totalHoldingCost: number;
  totalSellingCost: number;

  // Ingresos
  salePrice: number; // ARV
  grossProfit: number;
  netProfit: number;

  // Métricas
  roi: number; // Return on Investment (%)
  roiAnnualized: number; // ROI anualizado
  profitMargin: number; // Margen de beneficio (%)
  cashOnCashReturn: number; // Retorno sobre efectivo invertido (%)

  // Regla del 70%
  maxPurchasePrice70Rule: number;
  is70RuleCompliant: boolean;

  // Timeline
  totalProjectMonths: number;

  // Breakdown mensual
  monthlyBreakdown: MonthlyBreakdown[];

  // Análisis de sensibilidad
  sensitivity?: SensitivityAnalysis;
}

export interface MonthlyBreakdown {
  month: number;
  holdingCosts: number;
  loanPayment: number;
  cumulativeCosts: number;
  cashFlow: number;
}

export interface SensitivityAnalysis {
  scenarios: {
    label: string;
    arvChange: number; // % cambio en ARV
    renovationChange: number; // % cambio en costes renovación
    netProfit: number;
    roi: number;
  }[];
}

// ========================================
// CÁLCULOS PRINCIPALES
// ========================================

/**
 * Analiza completamente un deal de flipping
 */
export function analyzeDeal(input: DealAnalysisInput): DealAnalysisResult {
  // 1. COSTES DE COMPRA
  const purchasePrice = input.purchase.purchasePrice;
  const closingCostsPurchase = input.purchase.closingCosts || purchasePrice * 0.1; // 10% por defecto
  const totalPurchaseCost = purchasePrice + closingCostsPurchase;

  // 2. COSTES DE RENOVACIÓN
  const renovationCosts = input.renovation;
  const totalRenovationCost = Object.values(renovationCosts).reduce(
    (sum, cost) => sum + (cost || 0),
    0
  );

  // 3. COSTES DE MANTENIMIENTO (HOLDING)
  const holdingCostsPerMonth = Object.values(input.holding).reduce(
    (sum, cost) => sum + (cost || 0),
    0
  );
  const totalProjectMonths = input.renovationTimeMonths + (input.timeToSellMonths || 2);
  const totalHoldingCost = holdingCostsPerMonth * totalProjectMonths;

  // 4. COSTES DE VENTA
  const salePrice = input.afterRepairValue;
  const agentCommission = input.selling.agentCommission
    ? (salePrice * input.selling.agentCommission) / 100
    : salePrice * 0.06; // 6% por defecto
  const closingCostsSale = input.selling.closingCosts || salePrice * 0.02;
  const staging = input.selling.staging || 0;
  const marketing = input.selling.marketing || 0;
  const otherSellingCosts = input.selling.other || 0;
  const totalSellingCost =
    agentCommission + closingCostsSale + staging + marketing + otherSellingCosts;

  // 5. INVERSIÓN TOTAL Y BENEFICIO
  const totalInvestment =
    totalPurchaseCost + totalRenovationCost + totalHoldingCost + totalSellingCost;
  const grossProfit = salePrice - purchasePrice;
  const netProfit = salePrice - totalInvestment;

  // 6. EFECTIVO NECESARIO
  const downPayment = input.purchase.downPayment || 0;
  const loanAmount = input.purchase.loanAmount || 0;
  const cashNeeded = downPayment + (totalPurchaseCost - loanAmount) + totalRenovationCost;

  // 7. MÉTRICAS
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const roiAnnualized = totalProjectMonths > 0 ? (roi / totalProjectMonths) * 12 : roi;
  const profitMargin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
  const cashOnCashReturn = cashNeeded > 0 ? (netProfit / cashNeeded) * 100 : 0;

  // 8. REGLA DEL 70%
  const maxPurchasePrice70Rule = input.afterRepairValue * 0.7 - totalRenovationCost;
  const is70RuleCompliant = purchasePrice <= maxPurchasePrice70Rule;

  // 9. BREAKDOWN MENSUAL
  const monthlyBreakdown = calculateMonthlyBreakdown(
    totalProjectMonths,
    holdingCostsPerMonth,
    input.purchase.loanAmount || 0,
    input.purchase.interestRate || 0,
    input.purchase.loanTermMonths || 360
  );

  // 10. ANÁLISIS DE SENSIBILIDAD
  const sensitivity = calculateSensitivity(input);

  return {
    totalInvestment: roundToTwo(totalInvestment),
    cashNeeded: roundToTwo(cashNeeded),
    totalPurchaseCost: roundToTwo(totalPurchaseCost),
    totalRenovationCost: roundToTwo(totalRenovationCost),
    totalHoldingCost: roundToTwo(totalHoldingCost),
    totalSellingCost: roundToTwo(totalSellingCost),
    salePrice: roundToTwo(salePrice),
    grossProfit: roundToTwo(grossProfit),
    netProfit: roundToTwo(netProfit),
    roi: roundToTwo(roi),
    roiAnnualized: roundToTwo(roiAnnualized),
    profitMargin: roundToTwo(profitMargin),
    cashOnCashReturn: roundToTwo(cashOnCashReturn),
    maxPurchasePrice70Rule: roundToTwo(maxPurchasePrice70Rule),
    is70RuleCompliant,
    totalProjectMonths,
    monthlyBreakdown,
    sensitivity,
  };
}

/**
 * Calcula breakdown mensual de costes y cash flow
 */
function calculateMonthlyBreakdown(
  totalMonths: number,
  holdingCostsPerMonth: number,
  loanAmount: number,
  annualInterestRate: number,
  loanTermMonths: number
): MonthlyBreakdown[] {
  const breakdown: MonthlyBreakdown[] = [];

  // Calcular pago mensual del préstamo (si hay)
  const monthlyLoanPayment =
    loanAmount > 0 && annualInterestRate > 0
      ? calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermMonths)
      : 0;

  let cumulativeCosts = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const monthHolding = holdingCostsPerMonth;
    const monthLoan = monthlyLoanPayment;
    const totalMonthCost = monthHolding + monthLoan;

    cumulativeCosts += totalMonthCost;

    breakdown.push({
      month,
      holdingCosts: roundToTwo(monthHolding),
      loanPayment: roundToTwo(monthLoan),
      cumulativeCosts: roundToTwo(cumulativeCosts),
      cashFlow: roundToTwo(-totalMonthCost), // Negativo porque es salida
    });
  }

  return breakdown;
}

/**
 * Calcula pago mensual de un préstamo
 */
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return payment;
}

/**
 * Calcula análisis de sensibilidad
 */
function calculateSensitivity(input: DealAnalysisInput): SensitivityAnalysis {
  const scenarios = [
    { label: 'Mejor Caso (+10% ARV, -10% Renovación)', arvChange: 10, renovationChange: -10 },
    { label: 'Caso Base', arvChange: 0, renovationChange: 0 },
    { label: 'Peor Caso (-10% ARV, +20% Renovación)', arvChange: -10, renovationChange: 20 },
    {
      label: 'Escenario Conservador (-5% ARV, +15% Renovación)',
      arvChange: -5,
      renovationChange: 15,
    },
  ];

  const results = scenarios.map((scenario) => {
    // Ajustar ARV
    const adjustedARV = input.afterRepairValue * (1 + scenario.arvChange / 100);

    // Ajustar costes de renovación
    const totalRenovation = Object.values(input.renovation).reduce(
      (sum, cost) => sum + (cost || 0),
      0
    );
    const adjustedRenovation = totalRenovation * (1 + scenario.renovationChange / 100);

    // Crear input ajustado
    const adjustedInput: DealAnalysisInput = {
      ...input,
      afterRepairValue: adjustedARV,
      renovation: {
        ...input.renovation,
        structural: (input.renovation.structural || 0) * (1 + scenario.renovationChange / 100),
        plumbing: (input.renovation.plumbing || 0) * (1 + scenario.renovationChange / 100),
        electrical: (input.renovation.electrical || 0) * (1 + scenario.renovationChange / 100),
        hvac: (input.renovation.hvac || 0) * (1 + scenario.renovationChange / 100),
        flooring: (input.renovation.flooring || 0) * (1 + scenario.renovationChange / 100),
        painting: (input.renovation.painting || 0) * (1 + scenario.renovationChange / 100),
        kitchen: (input.renovation.kitchen || 0) * (1 + scenario.renovationChange / 100),
        bathrooms: (input.renovation.bathrooms || 0) * (1 + scenario.renovationChange / 100),
        exterior: (input.renovation.exterior || 0) * (1 + scenario.renovationChange / 100),
        landscaping: (input.renovation.landscaping || 0) * (1 + scenario.renovationChange / 100),
        contingency: (input.renovation.contingency || 0) * (1 + scenario.renovationChange / 100),
        other: (input.renovation.other || 0) * (1 + scenario.renovationChange / 100),
      },
    };

    // Calcular resultado
    const result = analyzeDeal(adjustedInput);

    return {
      label: scenario.label,
      arvChange: scenario.arvChange,
      renovationChange: scenario.renovationChange,
      netProfit: result.netProfit,
      roi: result.roi,
    };
  });

  return { scenarios: results };
}

// ========================================
// FUNCIONES DE VALIDACIÓN Y RECOMENDACIONES
// ========================================

/**
 * Valida si un deal es viable según reglas comunes
 */
export function validateDeal(analysis: DealAnalysisResult): {
  isViable: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Validar ROI mínimo (15% recomendado)
  if (analysis.roi < 15) {
    warnings.push(`ROI bajo (${analysis.roi}%). Se recomienda mínimo 15% para flipping.`);
  }

  // Validar regla del 70%
  if (!analysis.is70RuleCompliant) {
    warnings.push(`No cumple la regla del 70%. Precio de compra muy alto.`);
    recommendations.push(
      `Negociar precio de compra hasta máximo €${analysis.maxPurchasePrice70Rule.toLocaleString()}`
    );
  }

  // Validar margen de beneficio (20% recomendado)
  if (analysis.profitMargin < 20) {
    warnings.push(
      `Margen de beneficio bajo (${analysis.profitMargin}%). Se recomienda mínimo 20%.`
    );
  }

  // Validar beneficio neto positivo
  if (analysis.netProfit <= 0) {
    warnings.push(`Beneficio neto negativo. El deal perdería dinero.`);
  }

  // Validar tiempo de proyecto (max 12 meses recomendado)
  if (analysis.totalProjectMonths > 12) {
    warnings.push(
      `Proyecto muy largo (${analysis.totalProjectMonths} meses). Aumentan riesgos y costes.`
    );
    recommendations.push(`Buscar formas de reducir tiempo de renovación y venta.`);
  }

  // Recomendaciones adicionales
  if (analysis.roi >= 15 && analysis.is70RuleCompliant && analysis.profitMargin >= 20) {
    recommendations.push(`✅ Excelente oportunidad de inversión.`);
  } else if (analysis.roi >= 10 && analysis.profitMargin >= 15) {
    recommendations.push(
      `⚠️ Deal aceptable pero con riesgos. Considerar negociar mejores condiciones.`
    );
  }

  const isViable = analysis.roi >= 10 && analysis.netProfit > 0 && analysis.profitMargin >= 10;

  return {
    isViable,
    warnings,
    recommendations,
  };
}

/**
 * Genera reporte completo del análisis
 */
export function generateDealReport(analysis: DealAnalysisResult): string {
  const validation = validateDeal(analysis);

  return `
# ANÁLISIS COMPLETO DEL DEAL

## 📊 RESUMEN EJECUTIVO

${validation.isViable ? '✅ **DEAL VIABLE**' : '❌ **DEAL NO VIABLE**'}

**Beneficio Neto:** €${analysis.netProfit.toLocaleString()}
**ROI:** ${analysis.roi}% (${analysis.roiAnnualized}% anualizado)
**Margen de Beneficio:** ${analysis.profitMargin}%
**Duración del Proyecto:** ${analysis.totalProjectMonths} meses

---

## 💰 INVERSIÓN Y COSTES

### Inversión Total: €${analysis.totalInvestment.toLocaleString()}

| Concepto | Importe |
|----------|--------:|
| Compra (incluyendo cierre) | €${analysis.totalPurchaseCost.toLocaleString()} |
| Renovación | €${analysis.totalRenovationCost.toLocaleString()} |
| Mantenimiento (holding) | €${analysis.totalHoldingCost.toLocaleString()} |
| Venta (comisiones y cierre) | €${analysis.totalSellingCost.toLocaleString()} |

**Efectivo Necesario:** €${analysis.cashNeeded.toLocaleString()}

---

## 📈 INGRESOS Y BENEFICIO

**Precio de Venta (ARV):** €${analysis.salePrice.toLocaleString()}
**Beneficio Bruto:** €${analysis.grossProfit.toLocaleString()}
**Beneficio Neto:** €${analysis.netProfit.toLocaleString()}

---

## 🎯 MÉTRICAS CLAVE

| Métrica | Valor | Benchmark |
|---------|------:|-----------|
| ROI | ${analysis.roi}% | >15% |
| ROI Anualizado | ${analysis.roiAnnualized}% | >20% |
| Margen de Beneficio | ${analysis.profitMargin}% | >20% |
| Cash-on-Cash Return | ${analysis.cashOnCashReturn}% | >25% |

---

## 📜 REGLA DEL 70%

${analysis.is70RuleCompliant ? '✅' : '❌'} **${analysis.is70RuleCompliant ? 'CUMPLE' : 'NO CUMPLE'}**

**Precio Máximo Recomendado:** €${analysis.maxPurchasePrice70Rule.toLocaleString()}

La regla del 70% establece que el precio de compra no debe exceder:
*70% del ARV - Costes de Renovación*

---

## ⚠️ ADVERTENCIAS

${validation.warnings.length > 0 ? validation.warnings.map((w) => `- ${w}`).join('\n') : 'Sin advertencias'}

---

## 💡 RECOMENDACIONES

${validation.recommendations.length > 0 ? validation.recommendations.map((r) => `- ${r}`).join('\n') : 'Sin recomendaciones adicionales'}

---

## 📉 ANÁLISIS DE SENSIBILIDAD

${analysis.sensitivity?.scenarios
  .map(
    (s) => `
### ${s.label}
- ARV: ${s.arvChange > 0 ? '+' : ''}${s.arvChange}%
- Renovación: ${s.renovationChange > 0 ? '+' : ''}${s.renovationChange}%
- **Beneficio Neto:** €${s.netProfit.toLocaleString()}
- **ROI:** ${s.roi}%
`
  )
  .join('\n')}

---

*Análisis generado por INMOVA - Sistema de Gestión Inmobiliaria*
  `.trim();
}

// ========================================
// UTILIDADES
// ========================================

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calcula el máximo precio de oferta usando la regla del 70%
 */
export function calculate70RuleMaxOffer(arv: number, renovationCosts: number): number {
  return roundToTwo(arv * 0.7 - renovationCosts);
}

/**
 * Estima ARV basado en comparables
 */
export function estimateARV(comparables: number[]): {
  average: number;
  median: number;
  low: number;
  high: number;
  recommended: number;
} {
  if (comparables.length === 0) {
    throw new Error('Se requieren al menos un comparable');
  }

  const sorted = [...comparables].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const average = sum / sorted.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const low = sorted[0];
  const high = sorted[sorted.length - 1];

  // Recomendación conservadora: usar el menor entre promedio y mediana, menos 5%
  const recommended = Math.min(average, median) * 0.95;

  return {
    average: roundToTwo(average),
    median: roundToTwo(median),
    low: roundToTwo(low),
    high: roundToTwo(high),
    recommended: roundToTwo(recommended),
  };
}

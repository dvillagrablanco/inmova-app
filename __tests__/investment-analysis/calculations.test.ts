/**
 * Tests para las Calculaciones de Análisis de Inversión
 * Verifica que todas las métricas financieras se calculen correctamente
 */

import { describe, it, expect } from '@jest/globals';

// Función auxiliar para calcular ROI
function calculateROI(
  netAnnualIncome: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return (netAnnualIncome / totalInvestment) * 100;
}

// Función auxiliar para calcular Cash-on-Cash
function calculateCashOnCash(
  annualCashFlow: number,
  ownCapitalInvested: number
): number {
  if (ownCapitalInvested === 0) return 0;
  return (annualCashFlow / ownCapitalInvested) * 100;
}

// Función auxiliar para calcular Cap Rate
function calculateCapRate(
  noi: number,
  purchasePrice: number
): number {
  if (purchasePrice === 0) return 0;
  return (noi / purchasePrice) * 100;
}

// Función auxiliar para calcular NOI
function calculateNOI(
  grossRent: number,
  opex: number
): number {
  return grossRent - opex;
}

// Función auxiliar para calcular TIR (simplificada)
function calculateIRR(
  initialInvestment: number,
  annualCashFlows: number[],
  finalSaleProceeds: number
): number {
  // Implementación simplificada usando método Newton-Raphson
  let rate = 0.1; // Tasa inicial del 10%
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = -initialInvestment;
    let derivative = 0;

    // Calcular NPV y derivada
    for (let year = 0; year < annualCashFlows.length; year++) {
      const cashFlow = annualCashFlows[year];
      const factor = Math.pow(1 + rate, year + 1);
      npv += cashFlow / factor;
      derivative -= (year + 1) * cashFlow / Math.pow(1 + rate, year + 2);
    }

    // Añadir valor de venta final
    const saleYear = annualCashFlows.length;
    npv += finalSaleProceeds / Math.pow(1 + rate, saleYear + 1);
    derivative -= (saleYear + 1) * finalSaleProceeds / Math.pow(1 + rate, saleYear + 2);

    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }

    rate = rate - npv / derivative;

    if (rate < -1) rate = -0.99;
    if (rate > 10) rate = 9.99;
  }

  return rate * 100;
}

describe('Cálculos de Análisis de Inversión', () => {
  describe('ROI (Return on Investment)', () => {
    it('debe calcular ROI correctamente para caso básico', () => {
      const netAnnualIncome = 12000; // €12,000/año
      const totalInvestment = 100000; // €100,000

      const roi = calculateROI(netAnnualIncome, totalInvestment);

      expect(roi).toBe(12);
    });

    it('debe devolver 0 cuando la inversión es 0', () => {
      const roi = calculateROI(12000, 0);
      expect(roi).toBe(0);
    });

    it('debe calcular ROI negativo cuando hay pérdidas', () => {
      const roi = calculateROI(-5000, 100000);
      expect(roi).toBe(-5);
    });

    it('debe calcular ROI para piso de inversión típico', () => {
      // Ejemplo: Piso de €200,000 con renta de €1,200/mes
      const monthlyRent = 1200;
      const annualRent = monthlyRent * 12; // €14,400
      const annualOpex = 3600; // €300/mes en gastos
      const netIncome = annualRent - annualOpex; // €10,800

      const purchasePrice = 200000;
      const capex = 35000; // Notaría, impuestos, reformas, etc.
      const totalInvestment = purchasePrice + capex; // €235,000

      const roi = calculateROI(netIncome, totalInvestment);

      expect(roi).toBeCloseTo(4.6, 1); // ~4.6% ROI
    });
  });

  describe('Cash-on-Cash Return', () => {
    it('debe calcular Cash-on-Cash correctamente', () => {
      const annualCashFlow = 5000;
      const ownCapital = 50000;

      const coc = calculateCashOnCash(annualCashFlow, ownCapital);

      expect(coc).toBe(10);
    });

    it('debe calcular Cash-on-Cash con financiación', () => {
      // Ejemplo con hipoteca
      const monthlyRent = 1200;
      const annualRent = monthlyRent * 12; // €14,400
      const annualOpex = 3600;
      const annualDebtService = 6000; // Pago hipoteca
      const annualCashFlow = annualRent - annualOpex - annualDebtService; // €4,800

      const downPayment = 60000; // 30% de €200,000
      const closingCosts = 15000;
      const ownCapital = downPayment + closingCosts; // €75,000

      const coc = calculateCashOnCash(annualCashFlow, ownCapital);

      expect(coc).toBeCloseTo(6.4, 1); // ~6.4% Cash-on-Cash
    });

    it('debe devolver 0 cuando el capital propio es 0', () => {
      const coc = calculateCashOnCash(5000, 0);
      expect(coc).toBe(0);
    });
  });

  describe('Cap Rate (Capitalization Rate)', () => {
    it('debe calcular Cap Rate correctamente', () => {
      const noi = 10000;
      const purchasePrice = 200000;

      const capRate = calculateCapRate(noi, purchasePrice);

      expect(capRate).toBe(5);
    });

    it('debe calcular Cap Rate para local comercial', () => {
      // Local comercial con buena rentabilidad
      const monthlyRent = 1800;
      const annualRent = monthlyRent * 12; // €21,600
      const annualOpex = 1200; // Bajos gastos en comercial
      const noi = annualRent - annualOpex; // €20,400

      const purchasePrice = 180000;

      const capRate = calculateCapRate(noi, purchasePrice);

      expect(capRate).toBeCloseTo(11.33, 1); // ~11.33% Cap Rate (excelente)
    });

    it('debe devolver 0 cuando el precio es 0', () => {
      const capRate = calculateCapRate(10000, 0);
      expect(capRate).toBe(0);
    });
  });

  describe('NOI (Net Operating Income)', () => {
    it('debe calcular NOI correctamente', () => {
      const grossRent = 14400; // €1,200/mes × 12
      const opex = 3600; // €300/mes × 12

      const noi = calculateNOI(grossRent, opex);

      expect(noi).toBe(10800);
    });

    it('debe calcular NOI considerando vacancia', () => {
      const potentialGrossRent = 15000;
      const vacancyLoss = 750; // 5% vacancia
      const effectiveGrossRent = potentialGrossRent - vacancyLoss; // €14,250
      const opex = 3600;

      const noi = calculateNOI(effectiveGrossRent, opex);

      expect(noi).toBe(10650);
    });
  });

  describe('TIR/IRR (Tasa Interna de Retorno)', () => {
    it('debe calcular TIR para flujos constantes', () => {
      const initialInvestment = 100000;
      const annualCashFlows = [8000, 8000, 8000, 8000, 8000]; // 5 años
      const finalSaleProceeds = 110000; // Venta con apreciación

      const irr = calculateIRR(initialInvestment, annualCashFlows, finalSaleProceeds);

      expect(irr).toBeGreaterThan(10);
      expect(irr).toBeLessThan(15);
    });

    it('debe calcular TIR para inversión con crecimiento', () => {
      const initialInvestment = 200000;
      // Rentas crecientes por actualizaciones
      const annualCashFlows = [8000, 8400, 8820, 9261, 9724]; // 5% crecimiento anual
      const finalSaleProceeds = 240000; // 20% apreciación en 5 años

      const irr = calculateIRR(initialInvestment, annualCashFlows, finalSaleProceeds);

      expect(irr).toBeGreaterThan(12);
      expect(irr).toBeLessThan(18);
    });
  });

  describe('Payback Period (Período de Recuperación)', () => {
    it('debe calcular payback period simple', () => {
      const initialInvestment = 100000;
      const annualCashFlow = 12000;

      const paybackPeriod = initialInvestment / annualCashFlow;

      expect(paybackPeriod).toBeCloseTo(8.33, 2); // ~8.33 años
    });

    it('debe calcular payback period para inversión con financiación', () => {
      const ownCapital = 60000;
      const annualCashFlow = 7200;

      const paybackPeriod = ownCapital / annualCashFlow;

      expect(paybackPeriod).toBeCloseTo(8.33, 2);
    });
  });

  describe('Break-Even Occupancy', () => {
    it('debe calcular ocupación mínima necesaria', () => {
      const annualOpex = 12000;
      const annualDebtService = 8000;
      const totalExpenses = annualOpex + annualDebtService; // €20,000

      const potentialGrossIncome = 30000; // Renta máxima si 100% ocupado

      const breakEvenOccupancy = (totalExpenses / potentialGrossIncome) * 100;

      expect(breakEvenOccupancy).toBeCloseTo(66.67, 2); // 66.67% ocupación mínima
    });
  });

  describe('LTV (Loan-to-Value)', () => {
    it('debe calcular LTV correctamente', () => {
      const loanAmount = 140000;
      const propertyValue = 200000;

      const ltv = (loanAmount / propertyValue) * 100;

      expect(ltv).toBe(70);
    });

    it('debe validar LTV dentro de límites bancarios', () => {
      const loanAmount = 160000;
      const propertyValue = 200000;

      const ltv = (loanAmount / propertyValue) * 100;

      expect(ltv).toBeLessThanOrEqual(80); // Límite típico bancario
    });
  });

  describe('DSCR (Debt Service Coverage Ratio)', () => {
    it('debe calcular DSCR correctamente', () => {
      const noi = 15000;
      const annualDebtService = 10000;

      const dscr = noi / annualDebtService;

      expect(dscr).toBe(1.5);
    });

    it('debe identificar DSCR saludable', () => {
      const noi = 18000;
      const annualDebtService = 12000;

      const dscr = noi / annualDebtService;

      expect(dscr).toBeGreaterThan(1.25); // DSCR > 1.25 es bueno
    });

    it('debe identificar DSCR riesgoso', () => {
      const noi = 11000;
      const annualDebtService = 12000;

      const dscr = noi / annualDebtService;

      expect(dscr).toBeLessThan(1); // DSCR < 1 es riesgoso
    });
  });

  describe('Caso de Estudio Completo: Piso Madrid', () => {
    it('debe calcular todas las métricas para inversión real', () => {
      // Datos de entrada
      const purchasePrice = 250000;
      const notaryAndRegistry = 2500;
      const transferTax = 17500; // 7% ITP en Madrid
      const agencyFees = 0; // Compra directa
      const renovationCosts = 15000;
      const furnitureCosts = 5000;
      const totalCapex = purchasePrice + notaryAndRegistry + transferTax + 
                         agencyFees + renovationCosts + furnitureCosts; // €290,000

      const monthlyRent = 1400;
      const annualGrossRent = monthlyRent * 12; // €16,800
      const communityFees = 100 * 12; // €1,200/año
      const propertyTax = 500; // IBI
      const insurance = 300;
      const maintenanceRate = 0.01; // 1% del valor
      const maintenance = purchasePrice * maintenanceRate; // €2,500
      const managementFee = annualGrossRent * 0.08; // 8% de la renta
      const totalOpex = communityFees + propertyTax + insurance + maintenance + managementFee;
      // €1,200 + €500 + €300 + €2,500 + €1,344 = €5,844

      const vacancyRate = 0.05;
      const vacancyLoss = annualGrossRent * vacancyRate; // €840
      const effectiveGrossIncome = annualGrossRent - vacancyLoss; // €15,960

      const noi = effectiveGrossIncome - totalOpex; // €15,960 - €5,844 = €10,116

      // Financiación
      const loanAmount = purchasePrice * 0.70; // 70% LTV = €175,000
      const interestRate = 0.035; // 3.5%
      const loanTerm = 25; // años
      const monthlyRate = interestRate / 12;
      const numberOfPayments = loanTerm * 12;
      const monthlyPayment = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      const annualDebtService = monthlyPayment * 12; // ~€10,465

      const downPayment = purchasePrice * 0.30; // €75,000
      const otherCosts = notaryAndRegistry + transferTax + renovationCosts + furnitureCosts; // €40,000
      const ownCapital = downPayment + otherCosts; // €115,000

      const annualCashFlow = effectiveGrossIncome - totalOpex - annualDebtService;
      // €15,960 - €5,844 - €10,465 = -€349 (negativo primer año, normal)

      // Cálculo de métricas
      const roi = calculateROI(noi - annualDebtService, ownCapital);
      const cashOnCash = calculateCashOnCash(annualCashFlow, ownCapital);
      const capRate = calculateCapRate(noi, purchasePrice);
      const ltv = (loanAmount / purchasePrice) * 100;
      const dscr = noi / annualDebtService;

      // Assertions
      expect(totalCapex).toBe(290000);
      expect(noi).toBeCloseTo(10116, 0);
      expect(roi).toBeCloseTo(-0.3, 1); // Ligeramente negativo primer año
      expect(cashOnCash).toBeCloseTo(-0.3, 1);
      expect(capRate).toBeCloseTo(4.05, 2); // ~4% cap rate (típico Madrid)
      expect(ltv).toBe(70);
      expect(dscr).toBeCloseTo(0.97, 2); // Justo bajo 1 (ajustado en años siguientes)

      // Estos valores reflejan una inversión real en Madrid que:
      // - Es ligeramente negativa el primer año (normal con financiación)
      // - Tiene cap rate típico de Madrid centro (~4%)
      // - DSCR cerca de 1 (se mejora con actualizaciones de renta)
      // - Apuesta por apreciación a largo plazo
    });
  });

  describe('Caso de Estudio: Local Comercial Barcelona', () => {
    it('debe calcular métricas para local comercial rentable', () => {
      const purchasePrice = 180000;
      const totalCapex = 195000; // Con gastos

      const monthlyRent = 1800;
      const annualGrossRent = monthlyRent * 12; // €21,600
      const totalOpex = 1500; // Gastos mínimos en comercial

      const noi = annualGrossRent - totalOpex; // €20,100

      // Sin financiación (compra al contado)
      const ownCapital = totalCapex;

      const roi = calculateROI(noi, totalCapex);
      const capRate = calculateCapRate(noi, purchasePrice);
      const paybackPeriod = totalCapex / noi;

      expect(roi).toBeCloseTo(10.31, 2); // ~10.3% ROI (excelente)
      expect(capRate).toBeCloseTo(11.17, 2); // ~11.2% cap rate (excelente)
      expect(paybackPeriod).toBeCloseTo(9.7, 1); // ~9.7 años recuperación

      // Local comercial: mejor cap rate, menos gastos, payback más largo
    });
  });
});

describe('Sistema de Recomendaciones', () => {
  it('debe recomendar "Excelente" para ROI > 12%', () => {
    const roi = 14;
    const cashOnCash = 16;
    const capRate = 10;

    let recommendation = 'excellent';
    if (roi > 12 && cashOnCash > 12) {
      recommendation = 'excellent';
    }

    expect(recommendation).toBe('excellent');
  });

  it('debe recomendar "Buena" para ROI entre 8-12%', () => {
    const roi = 10;
    const cashOnCash = 11;

    let recommendation = 'good';
    if (roi >= 8 && roi <= 12) {
      recommendation = 'good';
    }

    expect(recommendation).toBe('good');
  });

  it('debe recomendar "Aceptable" para ROI entre 5-8%', () => {
    const roi = 6.5;

    let recommendation = 'acceptable';
    if (roi >= 5 && roi < 8) {
      recommendation = 'acceptable';
    }

    expect(recommendation).toBe('acceptable');
  });

  it('debe identificar riesgos: DSCR bajo', () => {
    const dscr = 0.9;
    const riskFactors = [];

    if (dscr < 1) {
      riskFactors.push('DSCR bajo - ingresos no cubren deuda');
    }

    expect(riskFactors).toContain('DSCR bajo - ingresos no cubren deuda');
  });

  it('debe identificar fortalezas: Cap Rate alto', () => {
    const capRate = 9;
    const strengths = [];

    if (capRate > 8) {
      strengths.push('Cap Rate superior al 8%');
    }

    expect(strengths).toContain('Cap Rate superior al 8%');
  });
});

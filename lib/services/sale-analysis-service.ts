/**
 * Servicio de Análisis de Venta de Activos
 * Calcula el momento óptimo para vender, plusvalía, ROI total, etc.
 */

import { prisma } from '@/lib/prisma';

export interface SaleAnalysisData {
  // Datos del activo
  unitId?: string;
  assetType: 'piso' | 'local' | 'garaje' | 'trastero' | 'edificio';
  
  // Inversión original
  originalPurchasePrice: number;
  originalPurchaseDate: Date;
  totalCapexInvested: number; // CAPEX inicial + mejoras acumuladas
  
  // Situación actual
  currentMarketValue: number; // Valor de mercado actual
  currentMonthlyRent: number;
  yearsHeld: number;
  
  // Proyección de venta
  proposedSalePrice: number;
  expectedSaleDate: Date;
  
  // Costos de venta
  agencyCommission: number; // % o valor fijo
  notaryCosts: number;
  capitalGainsTax: number; // % sobre plusvalía
  mortgagePayoff?: number; // Si hay hipoteca pendiente
  otherSaleCosts: number;
  
  // Datos históricos
  totalRentCollected: number; // Rentas cobradas desde compra
  totalExpensesIncurred: number; // Gastos totales desde compra
  mortgagePayments?: number; // Pagos de hipoteca realizados
  improvementsInvested?: number; // Mejoras realizadas durante tenencia
  
  // Escenarios alternativos
  alternativeScenarios?: {
    continueRenting?: {
      yearsToProject: number;
      expectedAppreciation: number; // % anual
      expectedRentIncrease: number; // % anual
    };
    renovateAndSell?: {
      renovationCost: number;
      expectedValueIncrease: number;
      monthsToComplete: number;
    };
  };
}

export interface SaleAnalysisResults {
  // Resultado de venta
  grossProceeds: number; // Precio venta bruto
  totalSaleCosts: number;
  netProceeds: number; // Neto tras costos
  
  // Plusvalía
  capitalGain: number; // Ganancia de capital
  capitalGainsTaxAmount: number;
  netCapitalGain: number; // Plusvalía neta tras impuestos
  
  // ROI Total de la inversión
  totalInvestment: number; // Inversión total (compra + mejoras + gastos)
  totalReturn: number; // Retorno total (rentas + venta neta)
  totalROI: number; // ROI % total
  annualizedROI: number; // ROI anualizado
  
  // Cash flow de la inversión
  totalCashIn: number; // Todo lo ingresado (rentas)
  totalCashOut: number; // Todo lo gastado (compra + gastos + mejoras)
  netCashFlow: number;
  
  // Comparación con mantener
  equityAtSale: number; // Equity al vender
  totalRentForgivenIfSold: number; // Renta que se pierde si vende
  
  // Métricas de decisión
  sellOrHoldRecommendation: 'sell_now' | 'hold_continue_renting' | 'renovate_then_sell' | 'consider_market';
  reasonsToSell: string[];
  reasonsToHold: string[];
  
  // Proyecciones si mantiene
  projectedValueIn5Years?: number;
  projectedNetIncomeIn5Years?: number;
  totalReturnIfHolds5Years?: number;
  
  // Break-even analysis
  breakEvenSalePrice: number; // Precio mínimo para recuperar inversión
  priceAboveBreakEven: number; // Cuánto está por encima del break-even
  breakEvenPercentage: number;
}

export class SaleAnalysisService {
  /**
   * Analizar la venta de un activo
   */
  static calculateSaleAnalysis(data: SaleAnalysisData): SaleAnalysisResults {
    // 1. Calcular costos de venta
    const agencyFee = 
      data.agencyCommission > 1 
        ? data.agencyCommission // Valor fijo
        : data.proposedSalePrice * (data.agencyCommission / 100); // Porcentaje
    
    const totalSaleCosts = 
      agencyFee +
      data.notaryCosts +
      data.otherSaleCosts;
    
    const grossProceeds = data.proposedSalePrice;
    
    // Si hay hipoteca pendiente, restarla de los ingresos netos
    const mortgagePayoff = data.mortgagePayoff || 0;
    
    // 2. Calcular plusvalía
    const capitalGain = data.proposedSalePrice - data.originalPurchasePrice;
    const capitalGainsTaxAmount = capitalGain * (data.capitalGainsTax / 100);
    const netCapitalGain = capitalGain - capitalGainsTaxAmount;
    
    // 3. Calcular ingresos netos de venta
    const netProceeds = grossProceeds - totalSaleCosts - capitalGainsTaxAmount - mortgagePayoff;
    
    // 4. Calcular inversión total
    const totalInvestment = 
      data.totalCapexInvested +
      (data.improvementsInvested || 0);
    
    // 5. Calcular retorno total
    const totalCashIn = data.totalRentCollected + netProceeds;
    const totalCashOut = totalInvestment + data.totalExpensesIncurred;
    const totalReturn = totalCashIn - totalCashOut;
    
    // 6. Calcular ROI total
    const totalROI = (totalReturn / totalInvestment) * 100;
    const annualizedROI = totalROI / data.yearsHeld;
    
    // 7. Calcular equity al vender
    const equityAtSale = netProceeds;
    
    // 8. Calcular break-even
    const breakEvenSalePrice = 
      data.originalPurchasePrice +
      totalSaleCosts +
      capitalGainsTaxAmount +
      (totalInvestment - data.originalPurchasePrice) - // Mejoras adicionales
      data.totalRentCollected +
      data.totalExpensesIncurred;
    
    const priceAboveBreakEven = data.proposedSalePrice - breakEvenSalePrice;
    const breakEvenPercentage = (priceAboveBreakEven / breakEvenSalePrice) * 100;
    
    // 9. Proyección si mantiene
    let projectedValueIn5Years = undefined;
    let projectedNetIncomeIn5Years = undefined;
    let totalReturnIfHolds5Years = undefined;
    
    if (data.alternativeScenarios?.continueRenting) {
      const scenario = data.alternativeScenarios.continueRenting;
      const years = scenario.yearsToProject;
      
      // Valor futuro con apreciación
      projectedValueIn5Years = data.currentMarketValue * 
        Math.pow(1 + scenario.expectedAppreciation / 100, years);
      
      // Renta futura proyectada (simplificado)
      let projectedAnnualIncome = 0;
      let currentRent = data.currentMonthlyRent * 12;
      
      for (let year = 1; year <= years; year++) {
        currentRent *= (1 + scenario.expectedRentIncrease / 100);
        projectedAnnualIncome += currentRent;
      }
      
      // Valor neto si mantiene y vende después
      const futureNetProceeds = 
        projectedValueIn5Years -
        (projectedValueIn5Years * 0.05) - // Costos venta futuros estimados
        ((projectedValueIn5Years - data.originalPurchasePrice) * (data.capitalGainsTax / 100));
      
      projectedNetIncomeIn5Years = projectedAnnualIncome;
      totalReturnIfHolds5Years = 
        totalCashIn + 
        projectedNetIncomeIn5Years + 
        futureNetProceeds -
        totalCashOut;
    }
    
    // 10. Calcular renta perdida si vende
    const totalRentForgivenIfSold = data.currentMonthlyRent * 12 * 5; // 5 años proyectados
    
    // 11. Recomendación
    const reasonsToSell: string[] = [];
    const reasonsToHold: string[] = [];
    
    // Razones para vender
    if (annualizedROI > 10) {
      reasonsToSell.push(`ROI anualizado excelente (${annualizedROI.toFixed(1)}%)`);
    }
    
    if (capitalGain > totalInvestment * 0.5) {
      reasonsToSell.push(`Plusvalía significativa (${((capitalGain / totalInvestment) * 100).toFixed(1)}% de la inversión)`);
    }
    
    if (data.yearsHeld >= 10) {
      reasonsToSell.push(`Inversión madura (${data.yearsHeld} años)`);
    }
    
    if (priceAboveBreakEven > totalInvestment * 0.3) {
      reasonsToSell.push(`Precio muy por encima del break-even (${breakEvenPercentage.toFixed(1)}%)`);
    }
    
    const currentCapRate = (data.currentMonthlyRent * 12) / data.currentMarketValue * 100;
    if (currentCapRate < 4) {
      reasonsToSell.push(`Cap Rate bajo (${currentCapRate.toFixed(1)}%) - mercado sobrevalorado`);
    }
    
    // Razones para mantener
    if (data.alternativeScenarios?.continueRenting && totalReturnIfHolds5Years) {
      const additionalReturn = totalReturnIfHolds5Years - totalReturn;
      if (additionalReturn > totalReturn * 0.3) {
        reasonsToHold.push(`Mantener 5 años más generaría €${additionalReturn.toLocaleString()} adicionales`);
      }
    }
    
    if (currentCapRate > 6) {
      reasonsToHold.push(`Cap Rate alto (${currentCapRate.toFixed(1)}%) - buen flujo de caja`);
    }
    
    if (data.yearsHeld < 3) {
      reasonsToHold.push(`Inversión reciente (${data.yearsHeld} años) - costos de transacción altos`);
    }
    
    const netProceedsPercentage = (netProceeds / totalInvestment) * 100;
    if (netProceedsPercentage < 120) {
      reasonsToHold.push(`Retorno modesto (${netProceedsPercentage.toFixed(0)}% de inversión) - puede mejorar`);
    }
    
    // Decidir recomendación
    let sellOrHoldRecommendation: SaleAnalysisResults['sellOrHoldRecommendation'] = 'consider_market';
    
    if (reasonsToSell.length >= 3 && annualizedROI > 10) {
      sellOrHoldRecommendation = 'sell_now';
    } else if (reasonsToHold.length > reasonsToSell.length) {
      sellOrHoldRecommendation = 'hold_continue_renting';
    } else if (data.alternativeScenarios?.renovateAndSell) {
      const renovationROI = 
        (data.alternativeScenarios.renovateAndSell.expectedValueIncrease - 
         data.alternativeScenarios.renovateAndSell.renovationCost) /
        data.alternativeScenarios.renovateAndSell.renovationCost * 100;
      
      if (renovationROI > 50) {
        sellOrHoldRecommendation = 'renovate_then_sell';
        reasonsToSell.push(`Renovación generaría ${renovationROI.toFixed(0)}% ROI adicional`);
      }
    }
    
    return {
      grossProceeds,
      totalSaleCosts,
      netProceeds,
      
      capitalGain,
      capitalGainsTaxAmount,
      netCapitalGain,
      
      totalInvestment,
      totalReturn,
      totalROI,
      annualizedROI,
      
      totalCashIn,
      totalCashOut,
      netCashFlow: totalReturn,
      
      equityAtSale,
      totalRentForgivenIfSold,
      
      sellOrHoldRecommendation,
      reasonsToSell,
      reasonsToHold,
      
      projectedValueIn5Years,
      projectedNetIncomeIn5Years,
      totalReturnIfHolds5Years,
      
      breakEvenSalePrice,
      priceAboveBreakEven,
      breakEvenPercentage,
    };
  }

  /**
   * Guardar análisis de venta
   */
  static async saveSaleAnalysis(
    userId: string,
    data: SaleAnalysisData,
    results: SaleAnalysisResults,
    name?: string
  ) {
    return await prisma.saleAnalysis.create({
      data: {
        userId,
        unitId: data.unitId,
        name: name || `Análisis Venta ${data.assetType} - ${new Date().toLocaleDateString()}`,
        assetType: data.assetType,
        
        // Inversión original
        originalPurchasePrice: data.originalPurchasePrice,
        originalPurchaseDate: data.originalPurchaseDate,
        totalCapexInvested: data.totalCapexInvested,
        
        // Situación actual
        currentMarketValue: data.currentMarketValue,
        currentMonthlyRent: data.currentMonthlyRent,
        yearsHeld: data.yearsHeld,
        
        // Proyección de venta
        proposedSalePrice: data.proposedSalePrice,
        expectedSaleDate: data.expectedSaleDate,
        
        // Costos
        agencyCommission: data.agencyCommission,
        notaryCosts: data.notaryCosts,
        capitalGainsTax: data.capitalGainsTax,
        mortgagePayoff: data.mortgagePayoff || 0,
        otherSaleCosts: data.otherSaleCosts,
        
        // Históricos
        totalRentCollected: data.totalRentCollected,
        totalExpensesIncurred: data.totalExpensesIncurred,
        mortgagePayments: data.mortgagePayments || 0,
        improvementsInvested: data.improvementsInvested || 0,
        
        // Resultados
        grossProceeds: results.grossProceeds,
        totalSaleCosts: results.totalSaleCosts,
        netProceeds: results.netProceeds,
        capitalGain: results.capitalGain,
        capitalGainsTaxAmount: results.capitalGainsTaxAmount,
        netCapitalGain: results.netCapitalGain,
        totalInvestment: results.totalInvestment,
        totalReturn: results.totalReturn,
        totalROI: results.totalROI,
        annualizedROI: results.annualizedROI,
        equityAtSale: results.equityAtSale,
        breakEvenSalePrice: results.breakEvenSalePrice,
        
        recommendation: results.sellOrHoldRecommendation,
        reasonsToSell: results.reasonsToSell,
        reasonsToHold: results.reasonsToHold,
      },
    });
  }

  /**
   * Obtener análisis de venta de un usuario
   */
  static async getUserSaleAnalyses(userId: string) {
    return await prisma.saleAnalysis.findMany({
      where: { userId },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            building: {
              select: {
                nombre: true,
                direccion: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener análisis específico
   */
  static async getSaleAnalysis(id: string, userId: string) {
    return await prisma.saleAnalysis.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        unit: true,
      },
    });
  }

  /**
   * Comparar análisis de venta con análisis de compra original
   */
  static async compareWithOriginalInvestment(
    saleAnalysisId: string,
    investmentAnalysisId: string,
    userId: string
  ) {
    const saleAnalysis = await this.getSaleAnalysis(saleAnalysisId, userId);
    const investmentAnalysis = await prisma.investmentAnalysis.findFirst({
      where: { id: investmentAnalysisId, userId },
    });

    if (!saleAnalysis || !investmentAnalysis) {
      throw new Error('Análisis no encontrados');
    }

    // Comparar proyecciones vs realidad
    return {
      original: {
        projectedROI: investmentAnalysis.roi,
        projectedCashOnCash: investmentAnalysis.cashOnCash,
        projectedPaybackPeriod: investmentAnalysis.paybackPeriod,
      },
      actual: {
        actualROI: saleAnalysis.totalROI,
        actualAnnualizedROI: saleAnalysis.annualizedROI,
        actualHoldingPeriod: saleAnalysis.yearsHeld,
      },
      variance: {
        roiVariance: saleAnalysis.annualizedROI - investmentAnalysis.roi,
        performanceSummary:
          saleAnalysis.annualizedROI > investmentAnalysis.roi
            ? 'Superó expectativas'
            : 'No alcanzó proyecciones',
      },
    };
  }
}

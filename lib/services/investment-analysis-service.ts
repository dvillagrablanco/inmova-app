import { prisma } from '@/lib/prisma';
import { InvestmentAnalysis, RentRoll } from '@prisma/client';

export interface InvestmentAnalysisData {
  assetType: 'piso' | 'local' | 'garaje' | 'trastero' | 'edificio';
  propertyId?: string;
  purchasePrice: number;
  notaryAndRegistry: number;
  transferTax: number;
  agencyFees: number;
  renovationCosts: number;
  furnitureCosts: number;
  initialLegalFees: number;
  otherInitialCosts: number;
  isFinanced: boolean;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  monthlyRent: number;
  communityFees: number;
  propertyTax: number;
  insurance: number;
  maintenanceRate: number;
  propertyManagementFee: number;
  vacancyRate: number;
  incomeTaxRate: number;
  capitalGainsTaxRate: number;
  wealthTaxApplicable: boolean;
  appreciationRate: number;
  rentIncreaseRate: number;
  inflationRate: number;
  holdingPeriod: number;
}

export interface InvestmentResults {
  totalCapex: number;
  ownCapital: number;
  grossAnnualIncome: number;
  effectiveAnnualIncome: number;
  totalAnnualOpex: number;
  mortgagePayment: number;
  annualTaxes: number;
  netOperatingIncome: number;
  netCashFlow: number;
  grossYield: number;
  netYield: number;
  roi: number;
  cashOnCash: number;
  capRate: number;
  monthlyMortgage: number;
  totalInterestPaid: number;
  loanToValue: number;
  debtServiceCoverageRatio: number;
  futurePropertyValue: number;
  totalEquityGain: number;
  cumulativeCashFlow: number;
  totalReturn: number;
  irr: number;
  paybackPeriod: number;
  breakEvenOccupancy: number;
  recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'not_recommended';
  riskFactors: string[];
  strengths: string[];
}

export class InvestmentAnalysisService {
  /**
   * Guarda un análisis de inversión
   */
  static async saveAnalysis(
    userId: string,
    data: InvestmentAnalysisData,
    results: InvestmentResults,
    name?: string
  ) {
    return await prisma.investmentAnalysis.create({
      data: {
        userId,
        propertyId: data.propertyId,
        name: name || `Análisis ${data.assetType} - ${new Date().toLocaleDateString()}`,
        assetType: data.assetType,
        
        // CAPEX
        purchasePrice: data.purchasePrice,
        notaryAndRegistry: data.notaryAndRegistry,
        transferTax: data.transferTax,
        agencyFees: data.agencyFees,
        renovationCosts: data.renovationCosts,
        furnitureCosts: data.furnitureCosts,
        initialLegalFees: data.initialLegalFees,
        otherInitialCosts: data.otherInitialCosts,
        totalCapex: results.totalCapex,
        
        // Financiación
        isFinanced: data.isFinanced,
        loanAmount: data.loanAmount,
        interestRate: data.interestRate,
        loanTerm: data.loanTerm,
        downPayment: data.downPayment,
        loanToValue: results.loanToValue,
        
        // OPEX
        monthlyRent: data.monthlyRent,
        communityFees: data.communityFees,
        propertyTax: data.propertyTax,
        insurance: data.insurance,
        maintenanceRate: data.maintenanceRate,
        propertyManagementFee: data.propertyManagementFee,
        vacancyRate: data.vacancyRate,
        totalAnnualOpex: results.totalAnnualOpex,
        
        // Impuestos
        incomeTaxRate: data.incomeTaxRate,
        capitalGainsTaxRate: data.capitalGainsTaxRate,
        wealthTaxApplicable: data.wealthTaxApplicable,
        
        // Proyecciones
        appreciationRate: data.appreciationRate,
        rentIncreaseRate: data.rentIncreaseRate,
        inflationRate: data.inflationRate,
        holdingPeriod: data.holdingPeriod,
        
        // Resultados
        roi: results.roi,
        cashOnCash: results.cashOnCash,
        capRate: results.capRate,
        netCashFlow: results.netCashFlow,
        netOperatingIncome: results.netOperatingIncome,
        irr: results.irr,
        paybackPeriod: results.paybackPeriod,
        breakEvenOccupancy: results.breakEvenOccupancy,
        futurePropertyValue: results.futurePropertyValue,
        totalReturn: results.totalReturn,
        
        recommendation: results.recommendation,
        riskFactors: results.riskFactors,
        strengths: results.strengths,
      },
    });
  }

  /**
   * Obtiene todos los análisis de un usuario
   */
  static async getUserAnalyses(userId: string) {
    return await prisma.investmentAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            titulo: true,
            direccion: true,
            imagen: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene un análisis específico
   */
  static async getAnalysis(id: string, userId: string) {
    return await prisma.investmentAnalysis.findFirst({
      where: { id, userId },
      include: {
        property: true,
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Actualiza un análisis
   */
  static async updateAnalysis(
    id: string,
    userId: string,
    data: Partial<InvestmentAnalysisData>,
    results?: Partial<InvestmentResults>
  ) {
    return await prisma.investmentAnalysis.update({
      where: { id },
      data: {
        ...data,
        ...results,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Elimina un análisis
   */
  static async deleteAnalysis(id: string, userId: string) {
    return await prisma.investmentAnalysis.delete({
      where: { id },
    });
  }

  /**
   * Comparte un análisis con otro usuario
   */
  static async shareAnalysis(
    analysisId: string,
    ownerId: string,
    targetEmail: string,
    permission: 'view' | 'edit' = 'view'
  ) {
    // Buscar usuario por email
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      throw new Error('Usuario no encontrado');
    }

    return await prisma.sharedAnalysis.create({
      data: {
        analysisId,
        userId: targetUser.id,
        permission,
      },
    });
  }

  /**
   * Obtiene análisis compartidos con un usuario
   */
  static async getSharedAnalyses(userId: string) {
    return await prisma.sharedAnalysis.findMany({
      where: { userId },
      include: {
        analysis: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            property: true,
          },
        },
      },
    });
  }

  /**
   * Compara múltiples análisis
   */
  static async compareAnalyses(analysisIds: string[], userId: string) {
    const analyses = await prisma.investmentAnalysis.findMany({
      where: {
        id: { in: analysisIds },
        OR: [
          { userId },
          { sharedWith: { some: { userId } } },
        ],
      },
      include: {
        property: true,
      },
    });

    return analyses.map(analysis => ({
      id: analysis.id,
      name: analysis.name,
      assetType: analysis.assetType,
      propertyName: analysis.property?.titulo,
      metrics: {
        roi: analysis.roi,
        cashOnCash: analysis.cashOnCash,
        capRate: analysis.capRate,
        irr: analysis.irr,
        totalReturn: analysis.totalReturn,
        paybackPeriod: analysis.paybackPeriod,
      },
      investment: {
        totalCapex: analysis.totalCapex,
        ownCapital: analysis.totalCapex - (analysis.loanAmount || 0),
        netCashFlow: analysis.netCashFlow,
      },
      recommendation: analysis.recommendation,
      strengths: analysis.strengths,
      riskFactors: analysis.riskFactors,
    }));
  }

  /**
   * Genera análisis desde un Rent Roll
   */
  static async createFromRentRoll(
    rentRollId: string,
    userId: string,
    additionalData: Partial<InvestmentAnalysisData>
  ) {
    const rentRoll = await prisma.rentRoll.findFirst({
      where: { id: rentRollId, userId },
      include: { property: true },
    });

    if (!rentRoll) {
      throw new Error('Rent Roll no encontrado');
    }

    // Calcular totales del rent roll
    const totalMonthlyRent = rentRoll.units.reduce(
      (sum: number, unit: any) => sum + (unit.currentRent || 0),
      0
    );
    const averageOccupancy = rentRoll.units.reduce(
      (sum: number, unit: any) => sum + (unit.occupied ? 100 : 0),
      0
    ) / rentRoll.units.length;

    const data: InvestmentAnalysisData = {
      assetType: rentRoll.property?.propertyType === 'EDIFICIO' ? 'edificio' : 'piso',
      propertyId: rentRoll.propertyId || undefined,
      purchasePrice: additionalData.purchasePrice || rentRoll.property?.precio || 0,
      monthlyRent: totalMonthlyRent,
      vacancyRate: 100 - averageOccupancy,
      
      // Valores por defecto que se pueden sobreescribir
      notaryAndRegistry: additionalData.notaryAndRegistry || 2000,
      transferTax: additionalData.transferTax || (additionalData.purchasePrice || 0) * 0.1,
      agencyFees: additionalData.agencyFees || 0,
      renovationCosts: additionalData.renovationCosts || 0,
      furnitureCosts: additionalData.furnitureCosts || 0,
      initialLegalFees: additionalData.initialLegalFees || 1000,
      otherInitialCosts: additionalData.otherInitialCosts || 0,
      
      isFinanced: additionalData.isFinanced ?? true,
      loanAmount: additionalData.loanAmount || 0,
      interestRate: additionalData.interestRate || 3.5,
      loanTerm: additionalData.loanTerm || 25,
      downPayment: additionalData.downPayment || 0,
      
      communityFees: additionalData.communityFees || 0,
      propertyTax: additionalData.propertyTax || 500,
      insurance: additionalData.insurance || 300,
      maintenanceRate: additionalData.maintenanceRate || 1,
      propertyManagementFee: additionalData.propertyManagementFee || 0,
      
      incomeTaxRate: additionalData.incomeTaxRate || 21,
      capitalGainsTaxRate: additionalData.capitalGainsTaxRate || 19,
      wealthTaxApplicable: additionalData.wealthTaxApplicable || false,
      
      appreciationRate: additionalData.appreciationRate || 3,
      rentIncreaseRate: additionalData.rentIncreaseRate || 2,
      inflationRate: additionalData.inflationRate || 2.5,
      holdingPeriod: additionalData.holdingPeriod || 10,
    };

    return data;
  }

  /**
   * Genera recomendaciones con IA
   */
  static async generateAIRecommendations(analysisId: string, userId: string) {
    const analysis = await this.getAnalysis(analysisId, userId);
    
    if (!analysis) {
      throw new Error('Análisis no encontrado');
    }

    const recommendations = [];

    // Análisis de ROI
    if (analysis.roi < 8) {
      if (analysis.renovationCosts > 0) {
        recommendations.push({
          type: 'cost_reduction',
          priority: 'high',
          title: 'Reducir costos de renovación',
          description: `Los costos de renovación de €${analysis.renovationCosts.toLocaleString()} están impactando negativamente el ROI. Considera realizar las reformas por fases o buscar contratistas más económicos.`,
          potentialImpact: `Reducir un 20% podría mejorar el ROI en ${((analysis.renovationCosts * 0.2 / analysis.totalCapex) * 100).toFixed(1)}%`,
        });
      }

      if (analysis.monthlyRent < analysis.purchasePrice * 0.006) {
        recommendations.push({
          type: 'income_increase',
          priority: 'high',
          title: 'Aumentar la renta mensual',
          description: `La renta actual de €${analysis.monthlyRent}/mes está por debajo del mercado (0.6% del valor). El objetivo debería ser al menos 0.8%.`,
          potentialImpact: `Aumentar a €${(analysis.purchasePrice * 0.008 / 12).toFixed(0)}/mes mejoraría el ROI significativamente.`,
        });
      }
    }

    // Análisis de Cash-on-Cash
    if (analysis.cashOnCash < 8) {
      if (analysis.isFinanced && analysis.loanToValue > 70) {
        recommendations.push({
          type: 'financing',
          priority: 'medium',
          title: 'Optimizar estructura de financiación',
          description: `Con un LTV de ${analysis.loanToValue.toFixed(1)}%, estás pagando mucho en intereses. Considera aumentar la entrada.`,
          potentialImpact: `Reducir LTV a 70% podría mejorar Cash-on-Cash en 2-3 puntos.`,
        });
      }

      if (analysis.propertyManagementFee > 8) {
        recommendations.push({
          type: 'cost_reduction',
          priority: 'medium',
          title: 'Autogestión o cambio de gestor',
          description: `Estás pagando ${analysis.propertyManagementFee}% en gestión, que es alto. Considera autogestionar o negociar un mejor fee.`,
          potentialImpact: `Reducir a 5% ahorraría €${((analysis.propertyManagementFee - 5) / 100 * analysis.monthlyRent * 12).toFixed(0)}/año`,
        });
      }
    }

    // Análisis de vacancia
    if (analysis.vacancyRate > 10) {
      recommendations.push({
        type: 'operations',
        priority: 'high',
        title: 'Reducir tasa de vacancia',
        description: `Una vacancia de ${analysis.vacancyRate}% es alta. Mejora el marketing, ajusta precio o mejora el inmueble.`,
        potentialImpact: `Reducir a 5% aumentaría ingresos en €${(analysis.monthlyRent * 12 * (analysis.vacancyRate - 5) / 100).toFixed(0)}/año`,
      });
    }

    // Análisis de DSCR
    if (analysis.isFinanced) {
      const dscr = analysis.netOperatingIncome / (analysis.mortgagePayment || 1);
      if (dscr < 1.25) {
        recommendations.push({
          type: 'financing',
          priority: 'critical',
          title: 'DSCR crítico - riesgo de impago',
          description: `Tu DSCR de ${dscr.toFixed(2)}x está por debajo del mínimo recomendado (1.25x). Esto indica alto riesgo financiero.`,
          potentialImpact: 'Aumentar ingresos o reducir deuda urgentemente.',
        });
      }
    }

    // Análisis de Cap Rate
    if (analysis.capRate < 5) {
      recommendations.push({
        type: 'strategy',
        priority: 'low',
        title: 'Cap Rate bajo - considera otras alternativas',
        description: `Un Cap Rate de ${analysis.capRate.toFixed(2)}% es bajo. Podrías obtener mejor retorno en otros inmuebles o mercados.`,
        potentialImpact: 'Evaluar oportunidades alternativas con Cap Rate >6%',
      });
    }

    // Oportunidades de mejora
    if (analysis.appreciationRate < 3) {
      recommendations.push({
        type: 'market',
        priority: 'low',
        title: 'Considera zonas con mayor apreciación',
        description: `Una apreciación proyectada de ${analysis.appreciationRate}% es conservadora. Investiga zonas emergentes.`,
        potentialImpact: 'Zonas en desarrollo pueden ofrecer 5-7% de apreciación anual.',
      });
    }

    return recommendations;
  }
}

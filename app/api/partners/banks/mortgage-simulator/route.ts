/**
 * API: Simulador de Hipotecas para Bancos Partners
 * 
 * POST /api/partners/banks/mortgage-simulator
 * 
 * Permite a los bancos partners ofrecer simulaciones de hipoteca
 * integradas en la plataforma Inmova. Cada simulación genera un lead.
 * 
 * Modelo de negocio:
 * - Lead cualificado: €50-150 para Inmova
 * - Hipoteca cerrada: 0.1-0.3% del importe para Inmova
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const mortgageSimulationSchema = z.object({
  // Datos del inmueble
  propertyValue: z.number().min(10000).max(10000000),
  propertyType: z.enum(['vivienda_habitual', 'segunda_vivienda', 'inversion']),
  propertyLocation: z.object({
    city: z.string(),
    province: z.string(),
    postalCode: z.string().optional(),
  }),
  
  // Datos de la hipoteca
  downPayment: z.number().min(0), // Entrada
  loanAmount: z.number().min(10000).optional(), // Si no se proporciona, se calcula
  loanTermYears: z.number().min(5).max(40).default(25),
  interestType: z.enum(['fijo', 'variable', 'mixto']).default('fijo'),
  
  // Datos del solicitante (para scoring)
  applicant: z.object({
    monthlyIncome: z.number().min(0),
    monthlyExpenses: z.number().min(0).optional(),
    employmentType: z.enum(['empleado', 'autonomo', 'funcionario', 'pensionista', 'otro']),
    age: z.number().min(18).max(75),
    hasOtherLoans: z.boolean().default(false),
    otherLoansMonthly: z.number().min(0).optional(),
  }),
  
  // Partner info
  partnerId: z.string().optional(), // Si viene de un partner específico
  
  // Tracking
  source: z.string().optional(), // utm_source, widget, landing...
  propertyId: z.string().optional(), // Si es para una propiedad específica de Inmova
});

// Tasas de interés por defecto (se personalizarían por banco partner)
const DEFAULT_RATES = {
  fijo: {
    min: 2.5,
    max: 3.5,
    typical: 2.95,
  },
  variable: {
    spread: 0.75, // Euríbor + spread
    min: 0.5,
    max: 1.2,
  },
  mixto: {
    fixedYears: 10,
    fixedRate: 2.0,
    variableSpread: 0.9,
  },
};

// Calcular cuota mensual (fórmula francesa)
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }
  
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
  return Math.round(payment * 100) / 100;
}

// Calcular ratio de endeudamiento
function calculateDebtRatio(
  monthlyPayment: number,
  monthlyIncome: number,
  otherLoans: number = 0
): number {
  return ((monthlyPayment + otherLoans) / monthlyIncome) * 100;
}

// Scoring simplificado
function calculateApprovalScore(data: z.infer<typeof mortgageSimulationSchema>): {
  score: number;
  level: 'alto' | 'medio' | 'bajo';
  factors: string[];
} {
  let score = 50;
  const factors: string[] = [];
  
  // Factor: LTV (Loan to Value)
  const ltv = ((data.propertyValue - data.downPayment) / data.propertyValue) * 100;
  if (ltv <= 60) {
    score += 20;
    factors.push('Excelente ratio préstamo/valor (≤60%)');
  } else if (ltv <= 80) {
    score += 10;
    factors.push('Buen ratio préstamo/valor (≤80%)');
  } else if (ltv > 90) {
    score -= 15;
    factors.push('Alto ratio préstamo/valor (>90%)');
  }
  
  // Factor: Tipo de empleo
  if (data.applicant.employmentType === 'funcionario') {
    score += 15;
    factors.push('Empleo estable (funcionario)');
  } else if (data.applicant.employmentType === 'empleado') {
    score += 10;
    factors.push('Empleado por cuenta ajena');
  } else if (data.applicant.employmentType === 'autonomo') {
    score += 5;
    factors.push('Autónomo (requiere más documentación)');
  }
  
  // Factor: Edad al finalizar
  const ageAtEnd = data.applicant.age + data.loanTermYears;
  if (ageAtEnd <= 65) {
    score += 10;
    factors.push('Edad adecuada al finalizar');
  } else if (ageAtEnd <= 75) {
    score += 0;
    factors.push('Edad al finalizar cercana a 75');
  } else {
    score -= 20;
    factors.push('Edad al finalizar superior a 75 años');
  }
  
  // Factor: Tipo de propiedad
  if (data.propertyType === 'vivienda_habitual') {
    score += 5;
    factors.push('Vivienda habitual');
  }
  
  // Factor: Otros préstamos
  if (data.applicant.hasOtherLoans) {
    score -= 10;
    factors.push('Tiene otros préstamos activos');
  }
  
  // Normalizar score
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    level: score >= 70 ? 'alto' : score >= 50 ? 'medio' : 'bajo',
    factors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validationResult = mortgageSimulationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Calcular importe del préstamo si no se proporciona
    const loanAmount = data.loanAmount || (data.propertyValue - data.downPayment);
    
    // Calcular LTV
    const ltv = (loanAmount / data.propertyValue) * 100;
    
    // Validar LTV máximo
    if (ltv > 100) {
      return NextResponse.json(
        { error: 'El importe del préstamo no puede superar el valor del inmueble' },
        { status: 400 }
      );
    }
    
    // Calcular cuotas para diferentes escenarios
    const scenarios = {
      fijo: {
        rate: DEFAULT_RATES.fijo.typical,
        monthlyPayment: calculateMonthlyPayment(
          loanAmount,
          DEFAULT_RATES.fijo.typical,
          data.loanTermYears
        ),
        totalInterest: 0,
        totalPayment: 0,
      },
      variable: {
        rate: DEFAULT_RATES.variable.spread,
        euribor: 3.5, // Euríbor actual aproximado
        monthlyPayment: calculateMonthlyPayment(
          loanAmount,
          3.5 + DEFAULT_RATES.variable.spread,
          data.loanTermYears
        ),
        totalInterest: 0,
        totalPayment: 0,
      },
      mixto: {
        fixedRate: DEFAULT_RATES.mixto.fixedRate,
        variableSpread: DEFAULT_RATES.mixto.variableSpread,
        monthlyPaymentFixed: calculateMonthlyPayment(
          loanAmount,
          DEFAULT_RATES.mixto.fixedRate,
          data.loanTermYears
        ),
        totalInterest: 0,
        totalPayment: 0,
      },
    };
    
    // Calcular totales
    const totalPayments = data.loanTermYears * 12;
    
    scenarios.fijo.totalPayment = scenarios.fijo.monthlyPayment * totalPayments;
    scenarios.fijo.totalInterest = scenarios.fijo.totalPayment - loanAmount;
    
    scenarios.variable.totalPayment = scenarios.variable.monthlyPayment * totalPayments;
    scenarios.variable.totalInterest = scenarios.variable.totalPayment - loanAmount;
    
    scenarios.mixto.totalPayment = scenarios.mixto.monthlyPaymentFixed * totalPayments;
    scenarios.mixto.totalInterest = scenarios.mixto.totalPayment - loanAmount;
    
    // Calcular ratio de endeudamiento
    const debtRatio = calculateDebtRatio(
      scenarios.fijo.monthlyPayment,
      data.applicant.monthlyIncome,
      data.applicant.otherLoansMonthly || 0
    );
    
    // Calcular scoring de aprobación
    const approvalScore = calculateApprovalScore(data);
    
    // Verificar ratio de endeudamiento
    const isDebtRatioOk = debtRatio <= 35;
    
    // Generar recomendación
    let recommendation = '';
    if (approvalScore.level === 'alto' && isDebtRatioOk) {
      recommendation = 'Excelente perfil. Alta probabilidad de aprobación con condiciones favorables.';
    } else if (approvalScore.level === 'medio' && isDebtRatioOk) {
      recommendation = 'Buen perfil. Probabilidad media-alta de aprobación.';
    } else if (!isDebtRatioOk) {
      recommendation = `El ratio de endeudamiento (${debtRatio.toFixed(1)}%) supera el 35% recomendado. Considera aumentar la entrada o reducir el plazo.`;
    } else {
      recommendation = 'Perfil que requiere revisión adicional. Recomendamos contactar con un asesor.';
    }
    
    // TODO: En producción, guardar el lead en la BD y notificar al partner
    // await saveMortgageLead(data, scenarios, approvalScore);
    
    const simulationResult = {
      // Resumen
      summary: {
        propertyValue: data.propertyValue,
        downPayment: data.downPayment,
        loanAmount,
        ltv: Math.round(ltv * 100) / 100,
        termYears: data.loanTermYears,
        termMonths: data.loanTermYears * 12,
      },
      
      // Escenarios de cuota
      scenarios: {
        fixed: {
          type: 'Tipo Fijo',
          rate: `${scenarios.fijo.rate}%`,
          monthlyPayment: scenarios.fijo.monthlyPayment,
          totalPayment: Math.round(scenarios.fijo.totalPayment),
          totalInterest: Math.round(scenarios.fijo.totalInterest),
          description: 'Cuota fija durante toda la vida del préstamo',
        },
        variable: {
          type: 'Tipo Variable',
          rate: `Euríbor + ${scenarios.variable.rate}%`,
          currentRate: `${(scenarios.variable.euribor + scenarios.variable.rate).toFixed(2)}%`,
          monthlyPayment: scenarios.variable.monthlyPayment,
          totalPayment: Math.round(scenarios.variable.totalPayment),
          totalInterest: Math.round(scenarios.variable.totalInterest),
          description: 'Cuota variable según Euríbor (ejemplo con Euríbor actual)',
          warning: 'La cuota puede variar según el Euríbor',
        },
        mixed: {
          type: 'Tipo Mixto',
          fixedRate: `${scenarios.mixto.fixedRate}% (primeros ${DEFAULT_RATES.mixto.fixedYears} años)`,
          variableRate: `Euríbor + ${scenarios.mixto.variableSpread}% (resto)`,
          monthlyPaymentFixed: scenarios.mixto.monthlyPaymentFixed,
          description: `Tipo fijo los primeros ${DEFAULT_RATES.mixto.fixedYears} años, después variable`,
        },
      },
      
      // Análisis financiero
      analysis: {
        debtRatio: Math.round(debtRatio * 100) / 100,
        maxRecommendedDebtRatio: 35,
        isDebtRatioOk,
        monthlyIncomeRequired: Math.round(scenarios.fijo.monthlyPayment / 0.35),
        approvalScore: approvalScore.score,
        approvalLevel: approvalScore.level,
        factors: approvalScore.factors,
      },
      
      // Recomendación
      recommendation,
      
      // Próximos pasos
      nextSteps: [
        'Solicitar pre-aprobación sin compromiso',
        'Aportar documentación básica (DNI, nóminas, IRPF)',
        'Recibir oferta personalizada del banco',
        'Tasación del inmueble',
        'Firma ante notario',
      ],
      
      // Metadata
      metadata: {
        simulationId: `SIM-${Date.now()}`,
        timestamp: new Date().toISOString(),
        partnerId: data.partnerId || null,
        source: data.source || 'direct',
        propertyId: data.propertyId || null,
      },
    };
    
    logger.info('[MortgageSimulator] Simulación completada', {
      loanAmount,
      ltv,
      approvalScore: approvalScore.score,
      partnerId: data.partnerId,
    });
    
    return NextResponse.json(simulationResult);
    
  } catch (error: any) {
    logger.error('[MortgageSimulator] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando simulación' },
      { status: 500 }
    );
  }
}

// GET: Obtener tasas actuales y configuración del simulador
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');
  
  // TODO: En producción, obtener tasas personalizadas del partner
  // const partnerRates = partnerId ? await getPartnerRates(partnerId) : null;
  
  return NextResponse.json({
    rates: DEFAULT_RATES,
    limits: {
      minLoanAmount: 10000,
      maxLoanAmount: 10000000,
      minTermYears: 5,
      maxTermYears: 40,
      maxLTV: 90, // Para vivienda habitual
      maxLTVSecondHome: 70,
      maxDebtRatio: 35,
    },
    propertyTypes: [
      { value: 'vivienda_habitual', label: 'Vivienda Habitual' },
      { value: 'segunda_vivienda', label: 'Segunda Vivienda' },
      { value: 'inversion', label: 'Inversión' },
    ],
    employmentTypes: [
      { value: 'empleado', label: 'Empleado' },
      { value: 'autonomo', label: 'Autónomo' },
      { value: 'funcionario', label: 'Funcionario' },
      { value: 'pensionista', label: 'Pensionista' },
      { value: 'otro', label: 'Otro' },
    ],
    disclaimer: 'Esta simulación es orientativa y no supone una oferta vinculante. Las condiciones finales pueden variar según el análisis de riesgo.',
  });
}

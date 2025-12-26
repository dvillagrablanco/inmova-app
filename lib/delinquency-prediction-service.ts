/**
 * Delinquency Prediction Service
 * Predicción de riesgo de morosidad usando Machine Learning
 */

import { logger } from './logger';
import prisma from './db';

interface TenantFeatures {
  paymentHistory: {
    totalPayments: number;
    latePayments: number;
    missedPayments: number;
    avgDaysLate: number;
    lastPaymentDate: Date | null;
  };
  tenantProfile: {
    monthsAsTenant: number;
    numberOfContracts: number;
    totalAmountPaid: number;
    hasVerifiedIdentity: boolean;
    hasVerifiedIncome: boolean;
  };
  currentContract: {
    monthlyRent: number;
    daysUntilDue: number;
    depositAmount: number;
    monthsIntoContract: number;
  };
  economic: {
    rentToIncomeRatio?: number; // Si tenemos datos de ingreso
    unemploymentRate?: number; // Tasa de desempleo en la zona
  };
}

interface DelinquencyPrediction {
  tenantId: string;
  tenantName: string;
  riskScore: number; // 0-100 (0 = bajo riesgo, 100 = alto riesgo)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  confidence: number; // 0-1
  factors: {
    paymentHistory: number; // Contribución del historial
    tenantProfile: number; // Contribución del perfil
    currentSituation: number; // Contribución situación actual
    economic: number; // Contribución factores económicos
  };
  recommendations: string[];
  predictedAction: 'monitor' | 'contact' | 'warning' | 'legal';
}

/**
 * Predice el riesgo de morosidad para un inquilino
 */
export async function predictDelinquencyRisk(tenantId: string): Promise<DelinquencyPrediction> {
  try {
    logger.info('Predicting delinquency risk', { tenantId });

    // 1. Obtener datos del inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        contracts: {
          include: {
            payments: {
              orderBy: { fecha: 'desc' },
            },
          },
          where: {
            estado: 'activo',
          },
          orderBy: { fechaInicio: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const currentContract = tenant.contracts[0];
    if (!currentContract) {
      throw new Error('No active contract found');
    }

    // 2. Extraer features
    const features = await extractFeatures(tenant, currentContract);

    // 3. Calcular score de riesgo usando modelo simplificado
    const prediction = calculateRiskScore(features);

    // 4. Agregar datos del inquilino
    const result: DelinquencyPrediction = {
      tenantId: tenant.id,
      tenantName: `${tenant.nombre} ${tenant.apellidos}`,
      ...prediction,
    };

    logger.info('Delinquency risk predicted', {
      tenantId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
    });

    return result;
  } catch (error) {
    logger.error('Error predicting delinquency risk', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });

    // Fallback: riesgo medio con baja confianza
    return {
      tenantId,
      tenantName: 'Error al cargar inquilino',
      riskScore: 50,
      riskLevel: 'medium',
      probability: 0.5,
      confidence: 0.1,
      factors: {
        paymentHistory: 0,
        tenantProfile: 0,
        currentSituation: 0,
        economic: 0,
      },
      recommendations: ['Error en predicción - revisar manualmente'],
      predictedAction: 'monitor',
    };
  }
}

/**
 * Extrae features del inquilino para el modelo
 */
async function extractFeatures(tenant: any, contract: any): Promise<TenantFeatures> {
  const payments = contract.payments || [];

  // Payment History
  const totalPayments = payments.length;
  const latePayments = payments.filter((p: any) => {
    const dueDate = new Date(contract.fechaInicio);
    dueDate.setDate(contract.diaVencimiento || 1);
    const paymentDate = new Date(p.fecha);
    return paymentDate > dueDate;
  }).length;

  const missedPayments = payments.filter(
    (p: any) => p.estado === 'pendiente' || p.estado === 'vencido'
  ).length;

  const latePaymentDays = payments
    .filter((p: any) => {
      const dueDate = new Date(contract.fechaInicio);
      dueDate.setDate(contract.diaVencimiento || 1);
      const paymentDate = new Date(p.fecha);
      return paymentDate > dueDate;
    })
    .map((p: any) => {
      const dueDate = new Date(contract.fechaInicio);
      dueDate.setDate(contract.diaVencimiento || 1);
      const paymentDate = new Date(p.fecha);
      return Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    });

  const avgDaysLate =
    latePaymentDays.length > 0
      ? latePaymentDays.reduce((a, b) => a + b, 0) / latePaymentDays.length
      : 0;

  const lastPaymentDate = payments.length > 0 ? new Date(payments[0].fecha) : null;

  // Tenant Profile
  const monthsAsTenant = Math.floor(
    (Date.now() - new Date(tenant.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const numberOfContracts = tenant.contracts?.length || 1;

  const totalAmountPaid = payments
    .filter((p: any) => p.estado === 'pagado' || p.estado === 'confirmado')
    .reduce((sum: number, p: any) => sum + (p.monto || 0), 0);

  const hasVerifiedIdentity = !!tenant.dni || !!tenant.documentoIdentidad;
  const hasVerifiedIncome = !!tenant.ingresosMensuales;

  // Current Contract
  const monthlyRent = contract.renta || 0;
  const depositAmount = contract.deposito || 0;

  const dueDate = new Date();
  dueDate.setDate(contract.diaVencimiento || 1);
  if (dueDate < new Date()) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }
  const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const monthsIntoContract = Math.floor(
    (Date.now() - new Date(contract.fechaInicio).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Economic
  const rentToIncomeRatio = tenant.ingresosMensuales
    ? (monthlyRent / tenant.ingresosMensuales) * 100
    : undefined;

  return {
    paymentHistory: {
      totalPayments,
      latePayments,
      missedPayments,
      avgDaysLate,
      lastPaymentDate,
    },
    tenantProfile: {
      monthsAsTenant,
      numberOfContracts,
      totalAmountPaid,
      hasVerifiedIdentity,
      hasVerifiedIncome,
    },
    currentContract: {
      monthlyRent,
      daysUntilDue,
      depositAmount,
      monthsIntoContract,
    },
    economic: {
      rentToIncomeRatio,
      unemploymentRate: undefined, // TODO: Obtener de fuente externa
    },
  };
}

/**
 * Calcula el score de riesgo basado en features
 * Modelo simplificado de regresión logística
 */
function calculateRiskScore(
  features: TenantFeatures
): Omit<DelinquencyPrediction, 'tenantId' | 'tenantName'> {
  let riskScore = 0;
  const weights = {
    paymentHistory: 0.4,
    tenantProfile: 0.25,
    currentSituation: 0.25,
    economic: 0.1,
  };

  const factorScores = {
    paymentHistory: 0,
    tenantProfile: 0,
    currentSituation: 0,
    economic: 0,
  };

  const recommendations: string[] = [];

  // 1. Payment History Score (0-100)
  let paymentHistoryScore = 0;

  if (features.paymentHistory.totalPayments > 0) {
    const lateRate = features.paymentHistory.latePayments / features.paymentHistory.totalPayments;
    const missedRate =
      features.paymentHistory.missedPayments / features.paymentHistory.totalPayments;

    paymentHistoryScore += lateRate * 40; // Máximo 40 puntos por pagos atrasados
    paymentHistoryScore += missedRate * 60; // Máximo 60 puntos por pagos perdidos

    if (features.paymentHistory.avgDaysLate > 7) {
      paymentHistoryScore += 10;
      recommendations.push('Pagos frecuentemente con retraso de más de 7 días');
    }

    if (missedRate > 0.2) {
      recommendations.push(`${(missedRate * 100).toFixed(0)}% de pagos perdidos - riesgo alto`);
    }
  } else {
    paymentHistoryScore = 50; // Sin historial = riesgo medio
    recommendations.push('Sin historial de pagos suficiente');
  }

  factorScores.paymentHistory = paymentHistoryScore;
  riskScore += paymentHistoryScore * weights.paymentHistory;

  // 2. Tenant Profile Score (0-100)
  let tenantProfileScore = 0;

  if (features.tenantProfile.monthsAsTenant < 3) {
    tenantProfileScore += 20;
    recommendations.push('Inquilino nuevo (< 3 meses)');
  }

  if (!features.tenantProfile.hasVerifiedIdentity) {
    tenantProfileScore += 15;
    recommendations.push('Identidad no verificada');
  }

  if (!features.tenantProfile.hasVerifiedIncome) {
    tenantProfileScore += 15;
    recommendations.push('Ingresos no verificados');
  }

  if (features.tenantProfile.totalAmountPaid === 0) {
    tenantProfileScore += 30;
  }

  factorScores.tenantProfile = tenantProfileScore;
  riskScore += tenantProfileScore * weights.tenantProfile;

  // 3. Current Situation Score (0-100)
  let currentSituationScore = 0;

  if (features.currentContract.daysUntilDue < 0) {
    const daysOverdue = Math.abs(features.currentContract.daysUntilDue);
    currentSituationScore += Math.min(daysOverdue * 3, 60);
    recommendations.push(`Pago vencido hace ${daysOverdue} días - acción urgente`);
  } else if (features.currentContract.daysUntilDue < 3) {
    currentSituationScore += 20;
    recommendations.push('Pago próximo a vencer - monitorear');
  }

  if (features.currentContract.monthsIntoContract < 2) {
    currentSituationScore += 10;
  }

  const depositCoverage =
    features.currentContract.depositAmount / features.currentContract.monthlyRent;
  if (depositCoverage < 1) {
    currentSituationScore += 15;
    recommendations.push('Depósito menor a 1 mes de renta');
  }

  factorScores.currentSituation = currentSituationScore;
  riskScore += currentSituationScore * weights.currentSituation;

  // 4. Economic Score (0-100)
  let economicScore = 0;

  if (features.economic.rentToIncomeRatio) {
    if (features.economic.rentToIncomeRatio > 35) {
      economicScore += 40;
      recommendations.push(
        `Renta es ${features.economic.rentToIncomeRatio.toFixed(0)}% del ingreso (> 35%)`
      );
    } else if (features.economic.rentToIncomeRatio > 30) {
      economicScore += 20;
    }
  } else {
    economicScore += 10; // Sin datos = pequeño incremento
  }

  factorScores.economic = economicScore;
  riskScore += economicScore * weights.economic;

  // Normalizar a 0-100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determinar nivel de riesgo
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore < 25) riskLevel = 'low';
  else if (riskScore < 50) riskLevel = 'medium';
  else if (riskScore < 75) riskLevel = 'high';
  else riskLevel = 'critical';

  // Calcular probabilidad (sigmoid function)
  const probability = 1 / (1 + Math.exp(-(riskScore - 50) / 10));

  // Calcular confianza basada en cantidad de datos
  let confidence = 0.5;
  if (features.paymentHistory.totalPayments > 6) confidence += 0.2;
  if (features.tenantProfile.monthsAsTenant > 6) confidence += 0.15;
  if (features.tenantProfile.hasVerifiedIdentity) confidence += 0.1;
  if (features.economic.rentToIncomeRatio) confidence += 0.05;
  confidence = Math.min(1.0, confidence);

  // Acción recomendada
  let predictedAction: 'monitor' | 'contact' | 'warning' | 'legal';
  if (riskLevel === 'critical' || features.currentContract.daysUntilDue < -30) {
    predictedAction = 'legal';
    recommendations.push('⚠️ ACCIÓN LEGAL RECOMENDADA');
  } else if (riskLevel === 'high' || features.currentContract.daysUntilDue < -7) {
    predictedAction = 'warning';
    recommendations.push('⚠️ Enviar aviso formal');
  } else if (riskLevel === 'medium') {
    predictedAction = 'contact';
    recommendations.push('📞 Contactar al inquilino');
  } else {
    predictedAction = 'monitor';
    recommendations.push('✅ Solo monitorear');
  }

  // Agregar recomendaciones finales
  if (riskScore > 60) {
    recommendations.push('Considerar plan de pagos');
  }
  if (!features.tenantProfile.hasVerifiedIdentity || !features.tenantProfile.hasVerifiedIncome) {
    recommendations.push('Completar verificación de documentos');
  }

  return {
    riskScore: Math.round(riskScore),
    riskLevel,
    probability: Math.round(probability * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    factors: factorScores,
    recommendations,
    predictedAction,
  };
}

/**
 * Predice riesgo para todos los inquilinos de una empresa
 */
export async function predictDelinquencyForAll(
  companyId: string
): Promise<DelinquencyPrediction[]> {
  try {
    logger.info('Predicting delinquency for all tenants', { companyId });

    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        activo: true,
      },
      select: {
        id: true,
      },
    });

    const predictions: DelinquencyPrediction[] = [];

    for (const tenant of tenants) {
      try {
        const prediction = await predictDelinquencyRisk(tenant.id);
        predictions.push(prediction);
      } catch (error) {
        logger.error('Error predicting for tenant', {
          tenantId: tenant.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Ordenar por risk score descendente
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    logger.info('Delinquency prediction completed', {
      companyId,
      totalTenants: tenants.length,
      predictionsGenerated: predictions.length,
      highRisk: predictions.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical')
        .length,
    });

    return predictions;
  } catch (error) {
    logger.error('Error in batch delinquency prediction', {
      error: error instanceof Error ? error.message : String(error),
      companyId,
    });
    return [];
  }
}

/**
 * Genera reporte de morosidad
 */
export async function generateDelinquencyReport(companyId: string): Promise<{
  summary: {
    totalTenants: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
    averageRiskScore: number;
  };
  predictions: DelinquencyPrediction[];
}> {
  const predictions = await predictDelinquencyForAll(companyId);

  return {
    summary: {
      totalTenants: predictions.length,
      lowRisk: predictions.filter((p) => p.riskLevel === 'low').length,
      mediumRisk: predictions.filter((p) => p.riskLevel === 'medium').length,
      highRisk: predictions.filter((p) => p.riskLevel === 'high').length,
      criticalRisk: predictions.filter((p) => p.riskLevel === 'critical').length,
      averageRiskScore:
        predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length
          : 0,
    },
    predictions,
  };
}

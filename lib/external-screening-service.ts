/**
 * SERVICIO DE SCREENING EXTERNO
 * 
 * Integración con servicios externos de verificación de crédito y morosidad:
 * - ASNEF/Equifax (España)
 * - Experian (Internacional)
 * - Veriff/Onfido (Verificación de identidad)
 * 
 * Nota: Estas integraciones requieren contratos comerciales con los proveedores.
 * El código está preparado para activar cuando se tengan las credenciales.
 * 
 * @module ExternalScreeningService
 */

import { prisma } from './db';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface ScreeningProvider {
  id: string;
  name: string;
  type: 'credit_bureau' | 'identity_verification' | 'employment' | 'income';
  enabled: boolean;
  requiredCredentials: string[];
}

export interface CreditCheckResult {
  provider: string;
  success: boolean;
  hasDebt: boolean;
  debtAmount?: number;
  riskScore?: number; // 0-1000
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated?: Date;
  details?: CreditDetail[];
  rawResponse?: any;
  error?: string;
}

export interface CreditDetail {
  creditor: string;
  amount: number;
  status: 'active' | 'resolved' | 'disputed';
  since?: Date;
}

export interface IdentityVerificationResult {
  provider: string;
  success: boolean;
  verified: boolean;
  matchScore: number; // 0-100
  documentType?: string;
  documentNumber?: string;
  isDocumentValid: boolean;
  isFaceMatch: boolean;
  alerts: string[];
  error?: string;
}

export interface EmploymentVerificationResult {
  provider: string;
  success: boolean;
  verified: boolean;
  employer?: string;
  position?: string;
  startDate?: Date;
  monthlyIncome?: number;
  contractType?: string;
  error?: string;
}

export interface FullScreeningResult {
  candidateId: string;
  timestamp: Date;
  creditCheck?: CreditCheckResult;
  identityVerification?: IdentityVerificationResult;
  employmentVerification?: EmploymentVerificationResult;
  overallScore: number;
  overallRisk: 'approved' | 'manual_review' | 'rejected';
  recommendations: string[];
}

// ============================================================================
// CONFIGURACIÓN DE PROVEEDORES
// ============================================================================

export const SCREENING_PROVIDERS: Record<string, ScreeningProvider> = {
  asnef: {
    id: 'asnef',
    name: 'ASNEF/Equifax',
    type: 'credit_bureau',
    enabled: !!process.env.ASNEF_API_KEY,
    requiredCredentials: ['ASNEF_API_KEY', 'ASNEF_CLIENT_ID'],
  },
  experian: {
    id: 'experian',
    name: 'Experian',
    type: 'credit_bureau',
    enabled: !!process.env.EXPERIAN_API_KEY,
    requiredCredentials: ['EXPERIAN_API_KEY', 'EXPERIAN_CLIENT_SECRET'],
  },
  veriff: {
    id: 'veriff',
    name: 'Veriff',
    type: 'identity_verification',
    enabled: !!process.env.VERIFF_API_KEY,
    requiredCredentials: ['VERIFF_API_KEY', 'VERIFF_API_SECRET'],
  },
  onfido: {
    id: 'onfido',
    name: 'Onfido',
    type: 'identity_verification',
    enabled: !!process.env.ONFIDO_API_KEY,
    requiredCredentials: ['ONFIDO_API_KEY'],
  },
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Ejecuta screening completo de un candidato
 */
export async function runFullScreening(
  candidateId: string,
  options: {
    checkCredit?: boolean;
    verifyIdentity?: boolean;
    verifyEmployment?: boolean;
  } = {}
): Promise<FullScreeningResult> {
  const {
    checkCredit = true,
    verifyIdentity = true,
    verifyEmployment = false,
  } = options;

  const timestamp = new Date();
  const recommendations: string[] = [];
  let totalScore = 100;

  // Obtener datos del candidato
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      screening: true,
    },
  });

  if (!candidate) {
    return {
      candidateId,
      timestamp,
      overallScore: 0,
      overallRisk: 'rejected',
      recommendations: ['Candidato no encontrado'],
    };
  }

  const result: FullScreeningResult = {
    candidateId,
    timestamp,
    overallScore: 100,
    overallRisk: 'approved',
    recommendations: [],
  };

  // 1. Verificación de crédito
  if (checkCredit && candidate.dni) {
    result.creditCheck = await checkCreditHistory(candidate.dni);
    
    if (result.creditCheck.success) {
      if (result.creditCheck.hasDebt) {
        totalScore -= 40;
        recommendations.push(`Deuda registrada: ${result.creditCheck.debtAmount?.toFixed(2) || 'N/A'}€`);
      }
      if (result.creditCheck.riskLevel === 'high' || result.creditCheck.riskLevel === 'very_high') {
        totalScore -= 30;
        recommendations.push('Alto riesgo crediticio detectado');
      }
    } else {
      recommendations.push(`No se pudo verificar crédito: ${result.creditCheck.error}`);
    }
  }

  // 2. Verificación de identidad
  if (verifyIdentity && candidate.dni) {
    result.identityVerification = await verifyIdentityDocument({
      documentNumber: candidate.dni,
      fullName: candidate.nombreCompleto,
    });

    if (result.identityVerification.success) {
      if (!result.identityVerification.verified) {
        totalScore -= 50;
        recommendations.push('Documento de identidad no verificado');
      }
      if (result.identityVerification.alerts.length > 0) {
        totalScore -= 10 * result.identityVerification.alerts.length;
        recommendations.push(...result.identityVerification.alerts);
      }
    } else {
      recommendations.push('Verificación de identidad pendiente');
    }
  }

  // 3. Verificación de empleo
  if (verifyEmployment) {
    result.employmentVerification = await verifyEmploymentStatus(candidate);
    
    if (result.employmentVerification.success && result.employmentVerification.verified) {
      if (!result.employmentVerification.monthlyIncome) {
        recommendations.push('Ingresos no verificados');
      }
    } else {
      recommendations.push('Empleo no verificado');
    }
  }

  // Calcular resultado final
  result.overallScore = Math.max(0, totalScore);
  result.recommendations = recommendations;

  if (result.overallScore >= 70) {
    result.overallRisk = 'approved';
  } else if (result.overallScore >= 40) {
    result.overallRisk = 'manual_review';
  } else {
    result.overallRisk = 'rejected';
  }

  // Guardar resultado en BD
  await saveScreeningResult(candidateId, result);

  logger.info(`📋 Screening completado para candidato ${candidateId}: ${result.overallRisk}`);

  return result;
}

// ============================================================================
// VERIFICACIÓN DE CRÉDITO
// ============================================================================

/**
 * Consulta historial crediticio en ASNEF/Experian
 */
export async function checkCreditHistory(dni: string): Promise<CreditCheckResult> {
  // Intentar ASNEF primero (España)
  if (SCREENING_PROVIDERS.asnef.enabled) {
    return checkAsnef(dni);
  }
  
  // Fallback a Experian
  if (SCREENING_PROVIDERS.experian.enabled) {
    return checkExperian(dni);
  }

  // Modo demo si no hay proveedores configurados
  return checkCreditDemo(dni);
}

async function checkAsnef(dni: string): Promise<CreditCheckResult> {
  try {
    const apiKey = process.env.ASNEF_API_KEY;
    const clientId = process.env.ASNEF_CLIENT_ID;
    const apiUrl = process.env.ASNEF_API_URL || 'https://api.equifax.es/asnef/v1';

    const response = await fetch(`${apiUrl}/consulta`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Client-Id': clientId!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documento: dni,
        tipoDocumento: 'NIF',
        consentimiento: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`ASNEF API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      provider: 'ASNEF',
      success: true,
      hasDebt: data.resultado === 'POSITIVO',
      debtAmount: data.importeTotal || 0,
      riskScore: data.scoring || 0,
      riskLevel: mapAsnefRisk(data.nivelRiesgo),
      lastUpdated: data.fechaActualizacion ? new Date(data.fechaActualizacion) : undefined,
      details: data.deudas?.map((d: any) => ({
        creditor: d.acreedor,
        amount: d.importe,
        status: d.estado,
        since: d.fechaInclusion ? new Date(d.fechaInclusion) : undefined,
      })),
      rawResponse: data,
    };
  } catch (error: any) {
    logger.error('Error en consulta ASNEF:', error);
    return {
      provider: 'ASNEF',
      success: false,
      hasDebt: false,
      riskLevel: 'medium',
      error: error.message,
    };
  }
}

async function checkExperian(dni: string): Promise<CreditCheckResult> {
  try {
    const apiKey = process.env.EXPERIAN_API_KEY;
    const apiUrl = process.env.EXPERIAN_API_URL || 'https://api.experian.com/credit/v2';

    const response = await fetch(`${apiUrl}/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumerIdentifier: dni,
        country: 'ES',
        reportType: 'BASIC',
      }),
    });

    if (!response.ok) {
      throw new Error(`Experian API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      provider: 'Experian',
      success: true,
      hasDebt: data.hasNegativeRecords,
      debtAmount: data.totalDebt,
      riskScore: data.creditScore,
      riskLevel: mapExperianRisk(data.riskIndicator),
      rawResponse: data,
    };
  } catch (error: any) {
    logger.error('Error en consulta Experian:', error);
    return {
      provider: 'Experian',
      success: false,
      hasDebt: false,
      riskLevel: 'medium',
      error: error.message,
    };
  }
}

function checkCreditDemo(dni: string): CreditCheckResult {
  // Simulación para desarrollo/demo
  const lastDigit = parseInt(dni.slice(-2, -1)) || 0;
  
  return {
    provider: 'DEMO',
    success: true,
    hasDebt: lastDigit > 7, // 20% tienen deuda en demo
    debtAmount: lastDigit > 7 ? (lastDigit * 500) : 0,
    riskScore: 1000 - (lastDigit * 100),
    riskLevel: lastDigit > 7 ? 'high' : lastDigit > 4 ? 'medium' : 'low',
    lastUpdated: new Date(),
  };
}

function mapAsnefRisk(level: string): CreditCheckResult['riskLevel'] {
  const mapping: Record<string, CreditCheckResult['riskLevel']> = {
    'BAJO': 'low',
    'MEDIO': 'medium',
    'ALTO': 'high',
    'MUY_ALTO': 'very_high',
  };
  return mapping[level] || 'medium';
}

function mapExperianRisk(indicator: number): CreditCheckResult['riskLevel'] {
  if (indicator >= 800) return 'low';
  if (indicator >= 600) return 'medium';
  if (indicator >= 400) return 'high';
  return 'very_high';
}

// ============================================================================
// VERIFICACIÓN DE IDENTIDAD
// ============================================================================

/**
 * Verifica documento de identidad
 */
export async function verifyIdentityDocument(params: {
  documentNumber: string;
  fullName: string;
  documentImage?: Buffer;
  selfieImage?: Buffer;
}): Promise<IdentityVerificationResult> {
  // Intentar Veriff primero
  if (SCREENING_PROVIDERS.veriff.enabled) {
    return verifyWithVeriff(params);
  }
  
  // Fallback a Onfido
  if (SCREENING_PROVIDERS.onfido.enabled) {
    return verifyWithOnfido(params);
  }

  // Modo demo
  return verifyIdentityDemo(params);
}

async function verifyWithVeriff(params: any): Promise<IdentityVerificationResult> {
  try {
    const apiKey = process.env.VERIFF_API_KEY;
    const apiSecret = process.env.VERIFF_API_SECRET;
    const apiUrl = 'https://stationapi.veriff.com/v1';

    // Crear sesión de verificación
    const response = await fetch(`${apiUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Auth-Client': apiSecret!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification: {
          person: {
            firstName: params.fullName.split(' ')[0],
            lastName: params.fullName.split(' ').slice(1).join(' '),
            idNumber: params.documentNumber,
          },
          vendorData: params.documentNumber,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Veriff API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      provider: 'Veriff',
      success: true,
      verified: data.verification.status === 'approved',
      matchScore: data.verification.confidence || 0,
      documentType: data.verification.document?.type,
      documentNumber: params.documentNumber,
      isDocumentValid: data.verification.document?.valid || false,
      isFaceMatch: data.verification.face?.match || false,
      alerts: data.verification.alerts || [],
    };
  } catch (error: any) {
    logger.error('Error en Veriff:', error);
    return {
      provider: 'Veriff',
      success: false,
      verified: false,
      matchScore: 0,
      isDocumentValid: false,
      isFaceMatch: false,
      alerts: [error.message],
      error: error.message,
    };
  }
}

async function verifyWithOnfido(params: any): Promise<IdentityVerificationResult> {
  try {
    const apiKey = process.env.ONFIDO_API_KEY;
    const apiUrl = 'https://api.eu.onfido.com/v3.6';

    // Crear applicant
    const response = await fetch(`${apiUrl}/applicants`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: params.fullName.split(' ')[0],
        last_name: params.fullName.split(' ').slice(1).join(' ') || 'N/A',
      }),
    });

    if (!response.ok) {
      throw new Error(`Onfido API error: ${response.status}`);
    }

    const data = await response.json();

    // En producción, esto iniciaría el flujo de verificación
    return {
      provider: 'Onfido',
      success: true,
      verified: false, // Pendiente de completar flujo
      matchScore: 0,
      isDocumentValid: false,
      isFaceMatch: false,
      alerts: ['Verificación iniciada, pendiente de completar'],
    };
  } catch (error: any) {
    logger.error('Error en Onfido:', error);
    return {
      provider: 'Onfido',
      success: false,
      verified: false,
      matchScore: 0,
      isDocumentValid: false,
      isFaceMatch: false,
      alerts: [error.message],
      error: error.message,
    };
  }
}

function verifyIdentityDemo(params: any): IdentityVerificationResult {
  // Validación básica del DNI español
  const dni = params.documentNumber?.toUpperCase();
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  const isValidFormat = dniRegex.test(dni);
  
  // Verificar letra del DNI
  let isValidLetter = false;
  if (isValidFormat) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.slice(0, 8));
    const expectedLetter = letters[number % 23];
    isValidLetter = dni[8] === expectedLetter;
  }

  return {
    provider: 'DEMO',
    success: true,
    verified: isValidFormat && isValidLetter,
    matchScore: isValidFormat && isValidLetter ? 95 : 0,
    documentType: 'DNI',
    documentNumber: dni,
    isDocumentValid: isValidFormat && isValidLetter,
    isFaceMatch: true, // Asumido en demo
    alerts: isValidFormat && isValidLetter ? [] : ['Formato de DNI inválido'],
  };
}

// ============================================================================
// VERIFICACIÓN DE EMPLEO
// ============================================================================

async function verifyEmploymentStatus(candidate: any): Promise<EmploymentVerificationResult> {
  // Esta función normalmente conectaría con:
  // - APIs de la Seguridad Social
  // - Servicios de verificación de nóminas
  // - APIs de empresas de recursos humanos
  
  // Por ahora, retornamos los datos del screening manual
  const screening = candidate.screening;
  
  return {
    provider: 'MANUAL',
    success: !!screening,
    verified: screening?.verificadoLaboral || false,
    employer: screening?.empresaTrabajo || undefined,
    position: screening?.puesto || undefined,
    monthlyIncome: screening?.ingresosMensuales || undefined,
    contractType: screening?.tipoContrato || undefined,
  };
}

// ============================================================================
// PERSISTENCIA
// ============================================================================

async function saveScreeningResult(
  candidateId: string,
  result: FullScreeningResult
): Promise<void> {
  try {
    await prisma.screeningCandidato.update({
      where: { candidateId },
      data: {
        verificacionExternaCompletada: true,
        verificacionExternaFecha: result.timestamp,
        verificacionExternaResultado: result.overallRisk,
        verificacionExternaScore: result.overallScore,
        verificacionExternaDetalles: JSON.stringify({
          creditCheck: result.creditCheck,
          identityVerification: result.identityVerification,
          employmentVerification: result.employmentVerification,
          recommendations: result.recommendations,
        }),
      },
    });
  } catch (error) {
    logger.error('Error guardando resultado de screening externo:', error);
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene el estado de los proveedores de screening
 */
export function getProvidersStatus(): Record<string, {
  enabled: boolean;
  configured: boolean;
  missingCredentials: string[];
}> {
  const status: Record<string, any> = {};

  for (const [id, provider] of Object.entries(SCREENING_PROVIDERS)) {
    const missingCredentials = provider.requiredCredentials.filter(
      cred => !process.env[cred]
    );
    
    status[id] = {
      enabled: provider.enabled,
      configured: missingCredentials.length === 0,
      missingCredentials,
    };
  }

  return status;
}

/**
 * Valida si se puede ejecutar screening externo
 */
export function canRunExternalScreening(): boolean {
  return Object.values(SCREENING_PROVIDERS).some(p => p.enabled);
}

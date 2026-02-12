import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * SCORING Y VERIFICACIÓN DE INQUILINOS TEMPORALES
 * 
 * Sistema de puntuación para evaluar riesgo y calidad de inquilinos
 */

import { prisma } from '../db';
import Anthropic from '@anthropic-ai/sdk';

// ==========================================
// TIPOS
// ==========================================

export interface TenantProfile {
  // Datos básicos
  nombre: string;
  email: string;
  telefono?: string;
  nacionalidad?: string;
  edad?: number;
  profesion?: string;
  
  // Documentación
  dniVerificado: boolean;
  pasaporteVerificado: boolean;
  visadoVerificado?: boolean;
  contratoLaboralVerificado?: boolean;
  
  // Situación laboral
  tipoEmpleo: 'empleado' | 'autonomo' | 'estudiante' | 'jubilado' | 'desempleado' | 'otro';
  ingresosMensuales?: number;
  empresaActual?: string;
  antiguedadLaboral?: number; // meses
  
  // Historial de alquiler
  alquileresAnteriores: number;
  referenciasPositivas: number;
  incidenciasReportadas: number;
  impagosRegistrados: number;
  
  // Motivo de estancia
  motivoTemporalidad: string;
  duracionPrevista: number; // meses
  
  // Adicional
  tieneAval?: boolean;
  avalVerificado?: boolean;
  mascota?: boolean;
  fumador?: boolean;
}

export interface ScoringResult {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  recommendation: 'approved' | 'approved_with_conditions' | 'review_required' | 'rejected';
  factors: ScoringFactor[];
  conditions?: string[];
  summary: string;
}

export interface ScoringFactor {
  category: string;
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  impact: 'positive' | 'neutral' | 'negative';
  details?: string;
}

export interface VerificationResult {
  verified: boolean;
  method: 'manual' | 'automatic' | 'external_api';
  verifiedAt: Date;
  verifiedBy?: string;
  expiresAt?: Date;
  details?: Record<string, any>;
}

// ==========================================
// CONFIGURACIÓN DE SCORING
// ==========================================

const SCORING_WEIGHTS = {
  documentacion: 25,
  solvencia: 30,
  historial: 25,
  perfil: 20,
};

const RISK_THRESHOLDS = {
  low: 75,
  medium: 55,
  high: 35,
  very_high: 0,
};

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Calcula el score completo de un inquilino
 */
export function calculateTenantScore(profile: TenantProfile): ScoringResult {
  const factors: ScoringFactor[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // ===== DOCUMENTACIÓN (25%) =====
  const docFactors = calculateDocumentationScore(profile);
  factors.push(...docFactors);
  const docScore = docFactors.reduce((sum, f) => sum + f.score, 0);
  const docMax = docFactors.reduce((sum, f) => sum + f.maxScore, 0);
  totalScore += (docScore / docMax) * SCORING_WEIGHTS.documentacion;
  maxPossibleScore += SCORING_WEIGHTS.documentacion;

  // ===== SOLVENCIA (30%) =====
  const solvencyFactors = calculateSolvencyScore(profile);
  factors.push(...solvencyFactors);
  const solvencyScore = solvencyFactors.reduce((sum, f) => sum + f.score, 0);
  const solvencyMax = solvencyFactors.reduce((sum, f) => sum + f.maxScore, 0);
  totalScore += (solvencyScore / solvencyMax) * SCORING_WEIGHTS.solvencia;
  maxPossibleScore += SCORING_WEIGHTS.solvencia;

  // ===== HISTORIAL (25%) =====
  const historyFactors = calculateHistoryScore(profile);
  factors.push(...historyFactors);
  const historyScore = historyFactors.reduce((sum, f) => sum + f.score, 0);
  const historyMax = historyFactors.reduce((sum, f) => sum + f.maxScore, 0);
  totalScore += (historyScore / historyMax) * SCORING_WEIGHTS.historial;
  maxPossibleScore += SCORING_WEIGHTS.historial;

  // ===== PERFIL (20%) =====
  const profileFactors = calculateProfileScore(profile);
  factors.push(...profileFactors);
  const profileScore = profileFactors.reduce((sum, f) => sum + f.score, 0);
  const profileMax = profileFactors.reduce((sum, f) => sum + f.maxScore, 0);
  totalScore += (profileScore / profileMax) * SCORING_WEIGHTS.perfil;
  maxPossibleScore += SCORING_WEIGHTS.perfil;

  // Calcular score final
  const finalScore = Math.round(totalScore);

  // Determinar nivel de riesgo
  let riskLevel: ScoringResult['riskLevel'];
  if (finalScore >= RISK_THRESHOLDS.low) riskLevel = 'low';
  else if (finalScore >= RISK_THRESHOLDS.medium) riskLevel = 'medium';
  else if (finalScore >= RISK_THRESHOLDS.high) riskLevel = 'high';
  else riskLevel = 'very_high';

  // Determinar recomendación
  let recommendation: ScoringResult['recommendation'];
  let conditions: string[] = [];

  if (finalScore >= 80) {
    recommendation = 'approved';
  } else if (finalScore >= 60) {
    recommendation = 'approved_with_conditions';
    conditions = generateConditions(factors, profile);
  } else if (finalScore >= 40) {
    recommendation = 'review_required';
    conditions = generateConditions(factors, profile);
  } else {
    recommendation = 'rejected';
  }

  // Generar resumen
  const summary = generateSummary(finalScore, riskLevel, factors);

  return {
    score: finalScore,
    riskLevel,
    recommendation,
    factors,
    conditions: conditions.length > 0 ? conditions : undefined,
    summary,
  };
}

// ==========================================
// CÁLCULOS POR CATEGORÍA
// ==========================================

function calculateDocumentationScore(profile: TenantProfile): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // DNI/Pasaporte verificado
  factors.push({
    category: 'documentacion',
    name: 'Identidad verificada',
    weight: 10,
    score: (profile.dniVerificado || profile.pasaporteVerificado) ? 10 : 0,
    maxScore: 10,
    impact: (profile.dniVerificado || profile.pasaporteVerificado) ? 'positive' : 'negative',
    details: profile.dniVerificado ? 'DNI verificado' : (profile.pasaporteVerificado ? 'Pasaporte verificado' : 'Sin verificar'),
  });

  // Contrato laboral (si aplica)
  if (profile.tipoEmpleo === 'empleado') {
    factors.push({
      category: 'documentacion',
      name: 'Contrato laboral',
      weight: 8,
      score: profile.contratoLaboralVerificado ? 8 : 0,
      maxScore: 8,
      impact: profile.contratoLaboralVerificado ? 'positive' : 'negative',
    });
  }

  // Visado (para extranjeros no UE)
  if (profile.nacionalidad && !isEUNational(profile.nacionalidad)) {
    factors.push({
      category: 'documentacion',
      name: 'Visado válido',
      weight: 7,
      score: profile.visadoVerificado ? 7 : 0,
      maxScore: 7,
      impact: profile.visadoVerificado ? 'positive' : 'negative',
    });
  }

  return factors;
}

function calculateSolvencyScore(profile: TenantProfile): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Ratio ingresos/renta (asumiendo renta de 1000€)
  const rentaEstimada = 1000;
  if (profile.ingresosMensuales) {
    const ratio = profile.ingresosMensuales / rentaEstimada;
    let score = 0;
    let impact: ScoringFactor['impact'] = 'negative';

    if (ratio >= 3) { score = 15; impact = 'positive'; }
    else if (ratio >= 2.5) { score = 12; impact = 'positive'; }
    else if (ratio >= 2) { score = 9; impact = 'neutral'; }
    else if (ratio >= 1.5) { score = 5; impact = 'negative'; }

    factors.push({
      category: 'solvencia',
      name: 'Ratio ingresos/renta',
      weight: 15,
      score,
      maxScore: 15,
      impact,
      details: `Ingresos: ${profile.ingresosMensuales}€ (ratio ${ratio.toFixed(1)}x)`,
    });
  }

  // Tipo de empleo
  const employmentScores: Record<string, number> = {
    empleado: 10,
    autonomo: 8,
    estudiante: 6,
    jubilado: 9,
    desempleado: 2,
    otro: 4,
  };

  factors.push({
    category: 'solvencia',
    name: 'Situación laboral',
    weight: 10,
    score: employmentScores[profile.tipoEmpleo] || 4,
    maxScore: 10,
    impact: ['empleado', 'jubilado'].includes(profile.tipoEmpleo) ? 'positive' : 
            profile.tipoEmpleo === 'desempleado' ? 'negative' : 'neutral',
    details: profile.tipoEmpleo,
  });

  // Antigüedad laboral
  if (profile.antiguedadLaboral !== undefined) {
    let score = 0;
    if (profile.antiguedadLaboral >= 24) score = 5;
    else if (profile.antiguedadLaboral >= 12) score = 4;
    else if (profile.antiguedadLaboral >= 6) score = 2;
    else if (profile.antiguedadLaboral >= 3) score = 1;

    factors.push({
      category: 'solvencia',
      name: 'Estabilidad laboral',
      weight: 5,
      score,
      maxScore: 5,
      impact: profile.antiguedadLaboral >= 12 ? 'positive' : 'neutral',
      details: `${profile.antiguedadLaboral} meses`,
    });
  }

  return factors;
}

function calculateHistoryScore(profile: TenantProfile): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Alquileres anteriores
  let expScore = 0;
  if (profile.alquileresAnteriores >= 3) expScore = 8;
  else if (profile.alquileresAnteriores >= 1) expScore = 5;
  else expScore = 2;

  factors.push({
    category: 'historial',
    name: 'Experiencia como inquilino',
    weight: 8,
    score: expScore,
    maxScore: 8,
    impact: profile.alquileresAnteriores >= 2 ? 'positive' : 'neutral',
    details: `${profile.alquileresAnteriores} alquileres previos`,
  });

  // Referencias positivas
  factors.push({
    category: 'historial',
    name: 'Referencias positivas',
    weight: 7,
    score: Math.min(profile.referenciasPositivas * 2, 7),
    maxScore: 7,
    impact: profile.referenciasPositivas >= 2 ? 'positive' : 'neutral',
    details: `${profile.referenciasPositivas} referencias`,
  });

  // Incidencias (factor negativo)
  const incidenciasPenalty = Math.min(profile.incidenciasReportadas * 3, 10);
  factors.push({
    category: 'historial',
    name: 'Incidencias reportadas',
    weight: 5,
    score: Math.max(5 - incidenciasPenalty, 0),
    maxScore: 5,
    impact: profile.incidenciasReportadas > 0 ? 'negative' : 'positive',
    details: profile.incidenciasReportadas > 0 ? `${profile.incidenciasReportadas} incidencias` : 'Sin incidencias',
  });

  // Impagos (factor muy negativo)
  const impagosPenalty = profile.impagosRegistrados * 5;
  factors.push({
    category: 'historial',
    name: 'Historial de pagos',
    weight: 5,
    score: Math.max(5 - impagosPenalty, 0),
    maxScore: 5,
    impact: profile.impagosRegistrados > 0 ? 'negative' : 'positive',
    details: profile.impagosRegistrados > 0 ? `${profile.impagosRegistrados} impagos` : 'Sin impagos registrados',
  });

  return factors;
}

function calculateProfileScore(profile: TenantProfile): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  // Motivo de temporalidad (algunos son más predecibles)
  const motivoScores: Record<string, number> = {
    trabajo: 10,
    estudios: 9,
    tratamiento_medico: 8,
    proyecto_temporal: 8,
    renovacion_vivienda: 7,
    vacaciones: 6,
    otro: 5,
  };

  factors.push({
    category: 'perfil',
    name: 'Motivo de estancia',
    weight: 10,
    score: motivoScores[profile.motivoTemporalidad] || 5,
    maxScore: 10,
    impact: ['trabajo', 'estudios'].includes(profile.motivoTemporalidad) ? 'positive' : 'neutral',
    details: profile.motivoTemporalidad,
  });

  // Duración prevista (estancias más largas suelen ser más estables)
  let durationScore = 5;
  if (profile.duracionPrevista >= 6) durationScore = 10;
  else if (profile.duracionPrevista >= 3) durationScore = 8;
  else if (profile.duracionPrevista >= 2) durationScore = 6;

  factors.push({
    category: 'perfil',
    name: 'Duración prevista',
    weight: 5,
    score: durationScore,
    maxScore: 10,
    impact: profile.duracionPrevista >= 3 ? 'positive' : 'neutral',
    details: `${profile.duracionPrevista} meses`,
  });

  // Aval
  if (profile.tieneAval) {
    factors.push({
      category: 'perfil',
      name: 'Aval disponible',
      weight: 5,
      score: profile.avalVerificado ? 5 : 3,
      maxScore: 5,
      impact: 'positive',
      details: profile.avalVerificado ? 'Verificado' : 'Pendiente verificación',
    });
  }

  return factors;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function isEUNational(nationality: string): boolean {
  const euCountries = [
    'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'GR', 'PL',
    'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE',
    'CY', 'MT', 'LU', 'IE', 'FI', 'SE', 'DK',
  ];
  return euCountries.includes(nationality.toUpperCase());
}

function generateConditions(factors: ScoringFactor[], profile: TenantProfile): string[] {
  const conditions: string[] = [];

  // Verificar factores negativos
  const negativeFactors = factors.filter(f => f.impact === 'negative');

  for (const factor of negativeFactors) {
    switch (factor.name) {
      case 'Identidad verificada':
        conditions.push('Requerir verificación de identidad antes de la firma');
        break;
      case 'Contrato laboral':
        conditions.push('Solicitar contrato laboral o justificante de ingresos');
        break;
      case 'Ratio ingresos/renta':
        conditions.push('Solicitar aval o fianza adicional (2 meses extra)');
        break;
      case 'Historial de pagos':
        conditions.push('Requerir pago trimestral por adelantado');
        break;
      case 'Incidencias reportadas':
        conditions.push('Incluir cláusula de penalización por incidencias');
        break;
    }
  }

  // Condiciones por perfil
  if (!profile.tieneAval && profile.ingresosMensuales && profile.ingresosMensuales < 2500) {
    conditions.push('Considerar solicitar aval bancario o personal');
  }

  return [...new Set(conditions)]; // Eliminar duplicados
}

function generateSummary(score: number, riskLevel: string, factors: ScoringFactor[]): string {
  const positiveFactors = factors.filter(f => f.impact === 'positive').length;
  const negativeFactors = factors.filter(f => f.impact === 'negative').length;

  let summary = `Score: ${score}/100 - Riesgo ${
    riskLevel === 'low' ? 'bajo' : 
    riskLevel === 'medium' ? 'medio' : 
    riskLevel === 'high' ? 'alto' : 'muy alto'
  }. `;

  if (positiveFactors > negativeFactors) {
    summary += `El perfil presenta ${positiveFactors} factores positivos. `;
  } else if (negativeFactors > 0) {
    summary += `Atención: ${negativeFactors} factores de riesgo detectados. `;
  }

  return summary;
}

/**
 * Genera análisis de scoring con IA
 */
export async function generateAIScoringAnalysis(
  profile: TenantProfile,
  scoringResult: ScoringResult
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Como experto en gestión de riesgos inmobiliarios, analiza este perfil de inquilino temporal:

PERFIL:
- Nombre: ${profile.nombre}
- Profesión: ${profile.profesion || 'No indicada'}
- Tipo empleo: ${profile.tipoEmpleo}
- Ingresos: ${profile.ingresosMensuales || 'No declarados'}€/mes
- Alquileres anteriores: ${profile.alquileresAnteriores}
- Referencias positivas: ${profile.referenciasPositivas}
- Incidencias: ${profile.incidenciasReportadas}
- Impagos: ${profile.impagosRegistrados}
- Motivo estancia: ${profile.motivoTemporalidad}
- Duración prevista: ${profile.duracionPrevista} meses

RESULTADO SCORING:
- Score: ${scoringResult.score}/100
- Nivel de riesgo: ${scoringResult.riskLevel}
- Recomendación: ${scoringResult.recommendation}
${scoringResult.conditions ? `- Condiciones sugeridas: ${scoringResult.conditions.join(', ')}` : ''}

Proporciona un análisis breve (3-4 párrafos) con:
1. Evaluación general del perfil
2. Principales fortalezas y debilidades
3. Recomendaciones específicas para el propietario
4. Cualquier señal de alerta a tener en cuenta

Sé objetivo y constructivo.`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL_FAST,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

/**
 * Verifica un documento de identidad
 */
export async function verifyIdentityDocument(
  tenantId: string,
  documentType: 'dni' | 'passport' | 'visa',
  documentData: {
    number: string;
    expiryDate?: Date;
    frontImage?: string;
    backImage?: string;
  }
): Promise<VerificationResult> {
  // TODO: Integrar con servicio de verificación externo (Onfido, Jumio, etc.)
  
  // Por ahora, verificación manual
  const verification = await prisma.identityVerification.create({
    data: {
      tenantId,
      documentType,
      documentNumber: documentData.number,
      expiryDate: documentData.expiryDate,
      frontImageUrl: documentData.frontImage,
      backImageUrl: documentData.backImage,
      status: 'pending',
    },
  });

  return {
    verified: false,
    method: 'manual',
    verifiedAt: new Date(),
    details: { verificationId: verification.id },
  };
}

export default {
  calculateTenantScore,
  generateAIScoringAnalysis,
  verifyIdentityDocument,
  SCORING_WEIGHTS,
  RISK_THRESHOLDS,
};

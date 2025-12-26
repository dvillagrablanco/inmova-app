import { prisma } from './db';
import { addDays } from 'date-fns';

// ==========================================
// MÓDULO: SEGURIDAD Y COMPLIANCE
// ==========================================

/**
 * Registra una verificación biométrica
 */
export async function recordBiometricVerification(data: {
  companyId: string;
  tenantId?: string;
  userId?: string;
  tipo: string;
  resultado: string;
  confidence?: number;
  metadata?: any;
  documentoVerificado?: string;
  proveedor?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const verification = await prisma.biometricVerification.create({
    data: {
      companyId: data.companyId,
      tenantId: data.tenantId,
      userId: data.userId,
      tipo: data.tipo,
      resultado: data.resultado,
      confidence: data.confidence,
      metadata: data.metadata,
      documentoVerificado: data.documentoVerificado,
      proveedor: data.proveedor || 'Veriff',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });

  return verification;
}

/**
 * Registra un consentimiento GDPR
 */
export async function recordGDPRConsent(data: {
  companyId: string;
  userId?: string;
  tenantId?: string;
  tipo: string;
  descripcion?: string;
  consentido: boolean;
  ipAddress: string;
  evidencia?: string;
  version?: string;
  idioma?: string;
}) {
  const consent = await prisma.gDPRConsent.create({
    data: {
      companyId: data.companyId,
      userId: data.userId,
      tenantId: data.tenantId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      consentido: data.consentido,
      ipAddress: data.ipAddress,
      evidencia: data.evidencia,
      version: data.version,
      idioma: data.idioma || 'es',
    },
  });

  return consent;
}

/**
 * Revoca un consentimiento GDPR
 */
export async function revokeGDPRConsent(consentId: string) {
  const consent = await prisma.gDPRConsent.update({
    where: { id: consentId },
    data: {
      revocado: true,
      fechaRevocacion: new Date(),
    },
  });

  return consent;
}

/**
 * Detecta fraude con ML (simulado)
 */
export async function detectFraud(data: {
  companyId: string;
  entityType: string;
  entityId: string;
  tipo: string;
  dataToAnalyze: any;
}) {
  // Simulación de análisis con ML
  const score = simulateMLFraudDetection(data.dataToAnalyze);
  const riesgo = score > 70 ? 'critico' : score > 40 ? 'alto' : score > 20 ? 'medio' : 'bajo';

  const factores: string[] = [];
  if (data.dataToAnalyze.ingresosMensuales < data.dataToAnalyze.rentaMensual * 3) {
    factores.push('Ingresos insuficientes');
  }
  if (data.dataToAnalyze.antiguedadLaboral < 6) {
    factores.push('Baja antigüedad laboral');
  }
  if (data.dataToAnalyze.historialCrediticio === 'malo') {
    factores.push('Mal historial crediticio');
  }

  const alert = await prisma.fraudAlert.create({
    data: {
      companyId: data.companyId,
      entityType: data.entityType,
      entityId: data.entityId,
      tipo: data.tipo,
      riesgo,
      score,
      razon: `Detectado riesgo ${riesgo} de fraude`,
      factores,
      detalles: data.dataToAnalyze,
      estado: 'abierto',
    },
  });

  return alert;
}

/**
 * Simula detección de fraude con ML
 */
function simulateMLFraudDetection(data: any): number {
  let score = 0;

  // Ratio ingresos/renta
  const ratio = data.ingresosMensuales / data.rentaMensual;
  if (ratio < 3) score += 30;
  else if (ratio < 3.5) score += 10;

  // Antigüedad laboral
  if (data.antiguedadLaboral < 6) score += 25;
  else if (data.antiguedadLaboral < 12) score += 10;

  // Historial crediticio
  if (data.historialCrediticio === 'malo') score += 40;
  else if (data.historialCrediticio === 'regular') score += 15;

  // Documentación incompleta
  if (!data.documentacionCompleta) score += 20;

  return Math.min(score, 100);
}

/**
 * Revisa una alerta de fraude
 */
export async function reviewFraudAlert(
  alertId: string,
  revisadoPor: string,
  accionTomada: string,
  notas?: string
) {
  const alert = await prisma.fraudAlert.update({
    where: { id: alertId },
    data: {
      revisado: true,
      revisadoPor,
      fechaRevision: new Date(),
      accionTomada,
      notas,
      estado: 'cerrado',
    },
  });

  return alert;
}

/**
 * Crea una auditoría de seguridad
 */
export async function createSecurityAudit(data: {
  companyId: string;
  tipo: string;
  alcance?: string;
  auditor?: string;
  herramienta?: string;
}) {
  const audit = await prisma.securityAudit.create({
    data: {
      companyId: data.companyId,
      tipo: data.tipo,
      alcance: data.alcance,
      fechaInicio: new Date(),
      auditor: data.auditor,
      herramienta: data.herramienta,
      estado: 'en_progreso',
      numCriticas: 0,
      numAltas: 0,
      numMedias: 0,
      numBajas: 0,
    },
  });

  return audit;
}

/**
 * Completa una auditoría de seguridad
 */
export async function completeSecurityAudit(
  auditId: string,
  vulnerabilidades: any,
  recomendaciones: any
) {
  // Contar vulnerabilidades por severidad
  const numCriticas = vulnerabilidades.filter((v: any) => v.severidad === 'critica').length;
  const numAltas = vulnerabilidades.filter((v: any) => v.severidad === 'alta').length;
  const numMedias = vulnerabilidades.filter((v: any) => v.severidad === 'media').length;
  const numBajas = vulnerabilidades.filter((v: any) => v.severidad === 'baja').length;

  // Calcular score de seguridad
  const totalVulnerabilidades = vulnerabilidades.length;
  const scoreSeguridad = Math.max(
    0,
    100 - numCriticas * 20 - numAltas * 10 - numMedias * 5 - numBajas * 2
  );

  const audit = await prisma.securityAudit.update({
    where: { id: auditId },
    data: {
      fechaFin: new Date(),
      vulnerabilidades,
      numCriticas,
      numAltas,
      numMedias,
      numBajas,
      recomendaciones,
      scoreSeguridad,
      estado: 'completada',
    },
  });

  return audit;
}

/**
 * Registra un incidente de seguridad
 */
export async function reportSecurityIncident(data: {
  companyId: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  afectados?: any;
  datosComprometidos?: any;
  detectadoPor?: string;
  fechaIncidente?: Date;
}) {
  const incident = await prisma.securityIncident.create({
    data: {
      companyId: data.companyId,
      tipo: data.tipo,
      severidad: data.severidad,
      titulo: data.titulo,
      descripcion: data.descripcion,
      afectados: data.afectados,
      datosComprometidos: data.datosComprometidos,
      detectadoPor: data.detectadoPor,
      fechaIncidente: data.fechaIncidente || new Date(),
      estado: 'detectado',
    },
  });

  // Si es crítico y hay datos comprometidos, marcar para notificación GDPR
  if (data.severidad === 'critica' && data.datosComprometidos) {
    await prisma.securityIncident.update({
      where: { id: incident.id },
      data: {
        notificadoGDPR: false, // Pendiente de notificación
      },
    });
  }

  return incident;
}

/**
 * Asigna un incidente de seguridad
 */
export async function assignSecurityIncident(incidentId: string, responsable: string) {
  const incident = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: {
      responsable,
      fechaAsignacion: new Date(),
      estado: 'en_investigacion',
    },
  });

  return incident;
}

/**
 * Resuelve un incidente de seguridad
 */
export async function resolveSecurityIncident(incidentId: string, accionesCorrectivas: any) {
  const incident = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: {
      accionesCorrectivas,
      fechaResolucion: new Date(),
      estado: 'resuelto',
    },
  });

  return incident;
}

/**
 * Notifica una brecha de datos según GDPR
 */
export async function notifyGDPRBreach(incidentId: string) {
  const incident = await prisma.securityIncident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new Error('Incidente no encontrado');
  }

  // En producción, aquí se enviaría notificación a autoridad de protección de datos
  // y a los afectados dentro de las 72 horas

  const updated = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: {
      notificadoGDPR: true,
      fechaNotificacion: new Date(),
    },
  });

  return updated;
}

/**
 * Obtiene estadísticas de seguridad
 */
export async function getSecurityStats(companyId: string) {
  const verificacionesBiometricas = await prisma.biometricVerification.count({
    where: { companyId },
  });

  const verificacionesExitosas = await prisma.biometricVerification.count({
    where: { companyId, resultado: 'passed' },
  });

  const alertasFraude = await prisma.fraudAlert.count({
    where: { companyId, estado: 'abierto' },
  });

  const alertasCriticas = await prisma.fraudAlert.count({
    where: { companyId, riesgo: 'critico', estado: 'abierto' },
  });

  const auditorias = await prisma.securityAudit.count({
    where: { companyId },
  });

  const ultimaAuditoria = await prisma.securityAudit.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  const incidentes = await prisma.securityIncident.count({
    where: { companyId },
  });

  const incidentesActivos = await prisma.securityIncident.count({
    where: {
      companyId,
      estado: { in: ['detectado', 'en_investigacion'] },
    },
  });

  return {
    verificacionesBiometricas,
    verificacionesExitosas,
    tasaExitoVerificacion:
      verificacionesBiometricas > 0
        ? (verificacionesExitosas / verificacionesBiometricas) * 100
        : 0,
    alertasFraude,
    alertasCriticas,
    auditorias,
    scoreSeguridad: ultimaAuditoria?.scoreSeguridad || null,
    incidentes,
    incidentesActivos,
  };
}

/**
 * Error Tracker Service
 * 
 * Sistema centralizado de captura, almacenamiento y análisis de errores.
 * Captura errores de frontend (React), backend (API Routes), y servicios externos.
 * 
 * Características:
 * - Captura automática de errores con contexto completo
 * - Almacenamiento en archivo de log y base de datos
 * - Deduplicación de errores repetidos
 * - Sugerencias de corrección con IA
 * - Notificaciones a Slack/Email para errores críticos
 * 
 * @module lib/error-tracker
 */

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// ============================================================================
// TIPOS
// ============================================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorSource = 'frontend' | 'backend' | 'api' | 'database' | 'external' | 'unknown';
export type ErrorStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

export interface TrackedError {
  id?: string;
  timestamp: Date;
  
  // Información del error
  message: string;
  stack?: string;
  code?: string;
  name: string;
  
  // Contexto
  source: ErrorSource;
  severity: ErrorSeverity;
  status: ErrorStatus;
  
  // Ubicación
  url?: string;
  route?: string;
  component?: string;
  function?: string;
  line?: number;
  column?: number;
  
  // Usuario y sesión
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  
  // Request (para errores de API)
  method?: string;
  body?: any;
  query?: any;
  headers?: Record<string, string>;
  
  // Ambiente
  environment: string;
  userAgent?: string;
  ip?: string;
  
  // Metadata adicional
  metadata?: Record<string, any>;
  
  // Resolución
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Conteo de ocurrencias (para deduplicación)
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  
  // Sugerencia de IA
  aiSuggestion?: string;
}

export interface ErrorTrackingOptions {
  captureStackTrace?: boolean;
  captureUserInfo?: boolean;
  captureRequestInfo?: boolean;
  notifyOnCritical?: boolean;
  deduplicateErrors?: boolean;
  maxLogFileSize?: number; // MB
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_OPTIONS: ErrorTrackingOptions = {
  captureStackTrace: true,
  captureUserInfo: true,
  captureRequestInfo: true,
  notifyOnCritical: true,
  deduplicateErrors: true,
  maxLogFileSize: 50, // 50MB
};

const ERROR_LOG_DIR = process.env.ERROR_LOG_DIR || '/tmp/inmova-errors';
const ERROR_LOG_FILE = path.join(ERROR_LOG_DIR, 'errors.jsonl');

// Cache en memoria para deduplicación
const errorCache = new Map<string, { count: number; lastSeen: Date; id?: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Genera un hash único para un error (para deduplicación)
 */
function generateErrorHash(error: Partial<TrackedError>): string {
  const key = `${error.name}:${error.message}:${error.source}:${error.route || error.url || 'unknown'}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Determina la severidad de un error basándose en su tipo y contexto
 */
function determineSeverity(error: Error, source: ErrorSource, metadata?: any): ErrorSeverity {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Errores críticos
  if (
    name.includes('fatal') ||
    message.includes('database') ||
    message.includes('prisma') ||
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    source === 'database'
  ) {
    return 'critical';
  }
  
  // Errores altos
  if (
    message.includes('payment') ||
    message.includes('stripe') ||
    message.includes('contract') ||
    name.includes('typeerror') ||
    name.includes('referenceerror')
  ) {
    return 'high';
  }
  
  // Errores medios
  if (
    message.includes('validation') ||
    message.includes('not found') ||
    name.includes('validationerror')
  ) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Asegura que el directorio de logs existe
 */
function ensureLogDirectory(): void {
  try {
    if (!fs.existsSync(ERROR_LOG_DIR)) {
      fs.mkdirSync(ERROR_LOG_DIR, { recursive: true });
    }
  } catch (e) {
    // En entornos sin acceso a filesystem (Vercel), ignorar
  }
}

/**
 * Escribe un error al archivo de log (JSONL format)
 */
function writeToLogFile(trackedError: TrackedError): void {
  try {
    ensureLogDirectory();
    
    const logLine = JSON.stringify({
      ...trackedError,
      timestamp: trackedError.timestamp.toISOString(),
      firstSeen: trackedError.firstSeen.toISOString(),
      lastSeen: trackedError.lastSeen.toISOString(),
    }) + '\n';
    
    fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf8');
    
    // Rotar log si es muy grande
    const stats = fs.statSync(ERROR_LOG_FILE);
    const maxSize = (DEFAULT_OPTIONS.maxLogFileSize || 50) * 1024 * 1024;
    
    if (stats.size > maxSize) {
      const backupFile = ERROR_LOG_FILE.replace('.jsonl', `.${Date.now()}.jsonl`);
      fs.renameSync(ERROR_LOG_FILE, backupFile);
    }
  } catch (e) {
    // Ignorar errores de escritura (puede no tener acceso al filesystem)
    logger.warn('[ErrorTracker] No se pudo escribir al archivo de log:', e);
  }
}

/**
 * Guarda un error en la base de datos
 */
async function saveToDatabase(trackedError: TrackedError): Promise<string | null> {
  try {
    // Verificar si existe un error similar reciente (deduplicación)
    const errorHash = generateErrorHash(trackedError);
    const cached = errorCache.get(errorHash);
    
    if (cached && DEFAULT_OPTIONS.deduplicateErrors) {
      // Actualizar contador y fecha
      cached.count++;
      cached.lastSeen = new Date();
      
      // Actualizar en BD si tenemos ID
      if (cached.id) {
        await prisma.errorLog.update({
          where: { id: cached.id },
          data: {
            occurrences: cached.count,
            lastSeenAt: cached.lastSeen,
          },
        }).catch(() => {});
      }
      
      return cached.id || null;
    }
    
    // Crear nuevo registro
    const errorLog = await prisma.errorLog.create({
      data: {
        errorHash,
        name: trackedError.name,
        message: trackedError.message.slice(0, 2000), // Limitar longitud
        stack: trackedError.stack?.slice(0, 5000),
        code: trackedError.code,
        source: trackedError.source,
        severity: trackedError.severity,
        status: trackedError.status,
        url: trackedError.url,
        route: trackedError.route,
        component: trackedError.component,
        userId: trackedError.userId,
        userEmail: trackedError.userEmail,
        userRole: trackedError.userRole,
        method: trackedError.method,
        environment: trackedError.environment,
        userAgent: trackedError.userAgent,
        ip: trackedError.ip,
        metadata: trackedError.metadata as any,
        occurrences: 1,
        firstSeenAt: trackedError.firstSeen,
        lastSeenAt: trackedError.lastSeen,
      },
    });
    
    // Guardar en cache
    errorCache.set(errorHash, {
      count: 1,
      lastSeen: new Date(),
      id: errorLog.id,
    });
    
    // Limpiar cache viejo
    setTimeout(() => {
      errorCache.delete(errorHash);
    }, CACHE_TTL);
    
    return errorLog.id;
  } catch (e) {
    logger.error('[ErrorTracker] Error guardando en BD:', e);
    return null;
  }
}

/**
 * Función principal para trackear un error
 */
export async function trackError(
  error: Error | string,
  context: {
    source?: ErrorSource;
    severity?: ErrorSeverity;
    url?: string;
    route?: string;
    component?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    method?: string;
    body?: any;
    query?: any;
    headers?: Record<string, string>;
    userAgent?: string;
    ip?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<string | null> {
  try {
    const err = typeof error === 'string' ? new Error(error) : error;
    const now = new Date();
    
    const trackedError: TrackedError = {
      timestamp: now,
      name: err.name || 'Error',
      message: err.message || 'Unknown error',
      stack: DEFAULT_OPTIONS.captureStackTrace ? err.stack : undefined,
      source: context.source || 'unknown',
      severity: context.severity || determineSeverity(err, context.source || 'unknown', context.metadata),
      status: 'new',
      url: context.url,
      route: context.route,
      component: context.component,
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      method: context.method,
      body: context.body,
      query: context.query,
      headers: context.headers,
      environment: process.env.NODE_ENV || 'development',
      userAgent: context.userAgent,
      ip: context.ip,
      metadata: context.metadata,
      occurrences: 1,
      firstSeen: now,
      lastSeen: now,
    };
    
    // Log al logger de Winston
    logger.error(`[${trackedError.source.toUpperCase()}] ${trackedError.message}`, {
      errorName: trackedError.name,
      severity: trackedError.severity,
      route: trackedError.route,
      userId: trackedError.userId,
    });
    
    // Escribir al archivo de log
    writeToLogFile(trackedError);
    
    // Guardar en base de datos
    const errorId = await saveToDatabase(trackedError);
    
    // Notificar si es crítico
    if (trackedError.severity === 'critical' && DEFAULT_OPTIONS.notifyOnCritical) {
      await notifyCriticalError(trackedError);
    }
    
    return errorId;
  } catch (e) {
    // El error tracker nunca debe causar errores adicionales
    logger.error('[ErrorTracker] Error interno:', e);
    return null;
  }
}

/**
 * Notifica errores críticos (Slack, Email, etc.)
 */
async function notifyCriticalError(error: TrackedError): Promise<void> {
  try {
    // Slack webhook si está configurado
    const slackWebhook = process.env.SLACK_ERROR_WEBHOOK;
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *ERROR CRÍTICO* en ${error.environment}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Error:* ${error.message}\n*Source:* ${error.source}\n*Route:* ${error.route || 'N/A'}\n*User:* ${error.userEmail || 'N/A'}`,
              },
            },
          ],
        }),
      }).catch(() => {});
    }
  } catch (e) {
    // Ignorar errores de notificación
  }
}

/**
 * Obtiene errores recientes de la base de datos
 */
export async function getRecentErrors(options: {
  limit?: number;
  severity?: ErrorSeverity;
  source?: ErrorSource;
  status?: ErrorStatus;
  since?: Date;
} = {}): Promise<TrackedError[]> {
  try {
    const where: any = {};
    
    if (options.severity) where.severity = options.severity;
    if (options.source) where.source = options.source;
    if (options.status) where.status = options.status;
    if (options.since) where.createdAt = { gte: options.since };
    
    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });
    
    return errors.map((e: any) => ({
      id: e.id,
      timestamp: e.createdAt,
      name: e.name,
      message: e.message,
      stack: e.stack,
      code: e.code,
      source: e.source as ErrorSource,
      severity: e.severity as ErrorSeverity,
      status: e.status as ErrorStatus,
      url: e.url,
      route: e.route,
      component: e.component,
      userId: e.userId,
      userEmail: e.userEmail,
      userRole: e.userRole,
      method: e.method,
      environment: e.environment,
      userAgent: e.userAgent,
      ip: e.ip,
      metadata: e.metadata as any,
      resolution: e.resolution,
      resolvedAt: e.resolvedAt,
      resolvedBy: e.resolvedBy,
      occurrences: e.occurrences,
      firstSeen: e.firstSeenAt,
      lastSeen: e.lastSeenAt,
      aiSuggestion: e.aiSuggestion,
    }));
  } catch (e) {
    logger.error('[ErrorTracker] Error obteniendo errores:', e);
    return [];
  }
}

/**
 * Actualiza el estado de un error
 */
export async function updateErrorStatus(
  errorId: string,
  status: ErrorStatus,
  resolution?: string,
  resolvedBy?: string
): Promise<boolean> {
  try {
    await prisma.errorLog.update({
      where: { id: errorId },
      data: {
        status,
        resolution,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolvedBy,
      },
    });
    return true;
  } catch (e) {
    logger.error('[ErrorTracker] Error actualizando estado:', e);
    return false;
  }
}

/**
 * Obtiene estadísticas de errores
 */
export async function getErrorStats(): Promise<{
  total: number;
  byStatus: Record<ErrorStatus, number>;
  bySeverity: Record<ErrorSeverity, number>;
  bySource: Record<ErrorSource, number>;
  last24h: number;
  last7d: number;
}> {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [total, byStatus, bySeverity, bySource, last24h, last7d] = await Promise.all([
      prisma.errorLog.count(),
      prisma.errorLog.groupBy({ by: ['status'], _count: true }),
      prisma.errorLog.groupBy({ by: ['severity'], _count: true }),
      prisma.errorLog.groupBy({ by: ['source'], _count: true }),
      prisma.errorLog.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.errorLog.count({ where: { createdAt: { gte: lastWeek } } }),
    ]);
    
    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status as ErrorStatus] = item._count;
        return acc;
      }, {} as Record<ErrorStatus, number>),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity as ErrorSeverity] = item._count;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source as ErrorSource] = item._count;
        return acc;
      }, {} as Record<ErrorSource, number>),
      last24h,
      last7d,
    };
  } catch (e) {
    logger.error('[ErrorTracker] Error obteniendo estadísticas:', e);
    return {
      total: 0,
      byStatus: {} as Record<ErrorStatus, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      bySource: {} as Record<ErrorSource, number>,
      last24h: 0,
      last7d: 0,
    };
  }
}

/**
 * Lee errores del archivo de log (para cuando BD no está disponible)
 */
export function readErrorsFromLogFile(limit: number = 100): TrackedError[] {
  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    return lines
      .slice(-limit)
      .reverse()
      .map(line => {
        try {
          const parsed = JSON.parse(line);
          return {
            ...parsed,
            timestamp: new Date(parsed.timestamp),
            firstSeen: new Date(parsed.firstSeen),
            lastSeen: new Date(parsed.lastSeen),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as TrackedError[];
  } catch (e) {
    return [];
  }
}

// ============================================================================
// UTILIDADES PARA FRONTEND
// ============================================================================

/**
 * Versión del tracker para uso en cliente (envía a API)
 */
export async function trackClientError(
  error: Error | string,
  context: {
    component?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const err = typeof error === 'string' ? { name: 'Error', message: error, stack: '' } : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    
    await fetch('/api/errors/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...err,
        source: 'frontend',
        component: context.component,
        url: context.url || (typeof window !== 'undefined' ? window.location.href : ''),
        userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        metadata: context.metadata,
      }),
    }).catch(() => {});
  } catch {
    // Ignorar errores del tracker
  }
}

export default {
  trackError,
  trackClientError,
  getRecentErrors,
  updateErrorStatus,
  getErrorStats,
  readErrorsFromLogFile,
};

/**
 * Sistema de Error Tracking Centralizado
 * Soporta integración con Sentry, pero funciona sin él
 * Captura errores críticos y los envía a múltiples destinos
 */

import logger from './logger';

export interface ErrorContext {
  userId?: string;
  companyId?: string;
  route?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  environment: 'production' | 'development' | 'staging';
}

// Almacenamiento en memoria de errores (para producción usar base de datos)
const errorLog: TrackedError[] = [];
const MAX_ERRORS_IN_MEMORY = 1000;

/**
 * Determina la severidad del error automáticamente
 */
function determineSeverity(error: Error, context: ErrorContext): TrackedError['severity'] {
  const errorMessage = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Crítico: errores de base de datos, pagos, autenticación
  if (
    errorMessage.includes('prisma') ||
    errorMessage.includes('database') ||
    errorMessage.includes('stripe') ||
    errorMessage.includes('payment') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication')
  ) {
    return 'critical';
  }

  // Alto: errores en lógica de negocio, APIs externas
  if (
    errorMessage.includes('contract') ||
    errorMessage.includes('tenant') ||
    errorMessage.includes('building') ||
    errorMessage.includes('api')
  ) {
    return 'high';
  }

  // Medio: errores de validación, UI
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('not found')
  ) {
    return 'medium';
  }

  // Bajo: el resto
  return 'low';
}

/**
 * Genera un ID único para el error
 */
function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Captura y registra un error
 */
export function captureError(
  error: Error | string,
  context: ErrorContext = {},
  severity?: TrackedError['severity']
): string {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const environment = (process.env.NODE_ENV as any) || 'development';

  const trackedError: TrackedError = {
    id: generateErrorId(),
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    timestamp: Date.now(),
    severity: severity || determineSeverity(errorObj, context),
    environment,
  };

  // Loguear localmente
  logger.error(`[${trackedError.severity.toUpperCase()}] ${trackedError.message}`, {
    errorId: trackedError.id,
    ...context,
    stack: errorObj.stack,
  });

  // Almacenar en memoria (con límite)
  errorLog.push(trackedError);
  if (errorLog.length > MAX_ERRORS_IN_MEMORY) {
    errorLog.shift(); // Remover el más antiguo
  }

  // Enviar a Sentry si está configurado
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(errorObj, {
      tags: {
        severity: trackedError.severity,
        component: context.component,
      },
      extra: context,
    });
  }

  // Si es crítico en producción, enviar notificación
  if (environment === 'production' && trackedError.severity === 'critical') {
    sendCriticalErrorNotification(trackedError).catch((err) =>
      console.error('Failed to send critical error notification:', err)
    );
  }

  return trackedError.id;
}

/**
 * Envía notificación de error crítico
 * (implementar según necesidades: email, Slack, etc.)
 */
async function sendCriticalErrorNotification(error: TrackedError): Promise<void> {
  // TODO: Implementar notificaciones (email, Slack, etc.)
  // Por ahora solo loguear
  logger.error(`⚠️ CRITICAL ERROR NOTIFICATION: ${error.message}`, {
    errorId: error.id,
    context: error.context,
  });
}

/**
 * Obtiene el historial de errores
 */
export function getErrorLog(filters?: {
  severity?: TrackedError['severity'];
  startTime?: number;
  endTime?: number;
  limit?: number;
}): TrackedError[] {
  let filtered = [...errorLog];

  if (filters?.severity) {
    filtered = filtered.filter((e) => e.severity === filters.severity);
  }

  if (filters?.startTime) {
    filtered = filtered.filter((e) => e.timestamp >= filters.startTime!);
  }

  if (filters?.endTime) {
    filtered = filtered.filter((e) => e.timestamp <= filters.endTime!);
  }

  // Ordenar por timestamp descendente (más recientes primero)
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Limpia el log de errores
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Hook de React para capturar errores en componentes
 */
export function useErrorTracking(componentName: string) {
  return {
    captureError: (error: Error | string, additionalContext?: Record<string, any>) =>
      captureError(error, {
        component: componentName,
        ...additionalContext,
      }),
  };
}

/**
 * Wrapper para async functions que captura errores automáticamente
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, context);
      throw error; // Re-throw para que el caller pueda manejarlo
    }
  }) as T;
}

/**
 * Inicializar Sentry (si está configurado)
 */
export function initializeErrorTracking(): void {
  // Solo en cliente
  if (typeof window === 'undefined') return;

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (sentryDsn && !(window as any).Sentry) {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          beforeSend(event, hint) {
            // Filtrar errores de hydration (ya que son cosméticos)
            const errorMessage = hint.originalException?.toString() || '';
            if (errorMessage.includes('Hydration')) {
              return null; // No enviar a Sentry
            }
            return event;
          },
        });

        (window as any).Sentry = Sentry;
        logger.info('Sentry initialized successfully');
      })
      .catch((err) => {
        logger.error('Failed to initialize Sentry:', err);
      });
  }
}

/**
 * React Error Boundary compatible
 */
export class ErrorBoundaryTracker {
  static onError(error: Error, errorInfo: { componentStack: string }): void {
    captureError(error, {
      component: 'ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }
}

/**
 * Estadísticas de errores
 */
export function getErrorStats(): {
  total: number;
  bySeverity: Record<string, number>;
  last24h: number;
  lastHour: number;
} {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const lastHour = now - 60 * 60 * 1000;

  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let last24hCount = 0;
  let lastHourCount = 0;

  for (const error of errorLog) {
    bySeverity[error.severity]++;
    if (error.timestamp >= last24h) last24hCount++;
    if (error.timestamp >= lastHour) lastHourCount++;
  }

  return {
    total: errorLog.length,
    bySeverity,
    last24h: last24hCount,
    lastHour: lastHourCount,
  };
}

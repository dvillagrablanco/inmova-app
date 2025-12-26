/**
 * Configuración de Sentry para Error Tracking y Performance Monitoring
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

// Inicializar Sentry solo si DSN está configurado
export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    logger.warn('Sentry DSN no configurado. Error tracking deshabilitado.');
    return;
  }

  Sentry.init({
    dsn,

    // Configuración del entorno
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (disponible en @sentry/nextjs v8+)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Configuración de errores
    beforeSend(event, hint) {
      // Filtrar errores no críticos
      if (event.exception) {
        const error = hint.originalException;

        // Ignorar errores de red temporales
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message).toLowerCase();
          if (message.includes('network') || message.includes('fetch')) {
            return null;
          }
        }
      }

      return event;
    },

    // Configuración de breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filtrar breadcrumbs de consola en producción
      if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },
  });

  logger.info('Sentry inicializado correctamente');
}

// Función helper para capturar excepciones manualmente
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });

  logger.error('Error capturado en Sentry', { error, context });
}

// Función helper para capturar mensajes
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
}

// Establecer contexto de usuario
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  companyId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.role,
    companyId: user.companyId,
  });
}

// Limpiar contexto de usuario (logout)
export function clearUserContext() {
  Sentry.setUser(null);
}

// Añadir breadcrumb personalizado
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// Capturar métricas de rendimiento
export function capturePerformanceMetric(metricName: string, value: number, unit: string = 'ms') {
  // Agregar métrica como breadcrumb para tracking
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metricName}: ${value}${unit}`,
    level: 'info',
    data: {
      metricName,
      value,
      unit,
      environment: process.env.NODE_ENV || 'development',
    },
  });
}

export { Sentry };

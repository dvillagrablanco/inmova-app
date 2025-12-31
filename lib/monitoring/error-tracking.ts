/**
 * Error Tracking Service
 *
 * Sistema centralizado para capturar, reportar y analizar errores
 * Integrado con Sentry + custom logging
 */

import * as Sentry from '@sentry/nextjs';
import logger from '@/lib/logger';

// Types
interface ErrorContext {
  userId?: string;
  userEmail?: string;
  companyId?: string;
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info';
  context: ErrorContext;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

// Configuración
const config = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
};

// Inicializar Sentry
export function initErrorTracking(): void {
  if (!config.enabled || !config.sentryDSN) return;

  Sentry.init({
    dsn: config.sentryDSN,
    environment: config.environment,
    tracesSampleRate: 0.1, // 10% de transacciones
    profilesSampleRate: 0.1, // 10% de profiles

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Configuración de performance monitoring
        tracePropagationTargets: ['localhost', /^https:\/\/inmovaapp\.com/],
      }),
      Sentry.replayIntegration({
        // Session Replay para debugging
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Replay on error (no en todas las sesiones)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtrar errores comunes
    beforeSend(event, hint) {
      const error = hint.originalException as Error;

      // Ignorar errores conocidos/esperados
      if (error?.message?.includes('ResizeObserver loop')) return null;
      if (error?.message?.includes('Loading chunk')) return null;

      return event;
    },
  });
}

// Capturar error
export function captureError(error: Error | string, context?: ErrorContext): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // Log local
  logger.error('Error captured', {
    message: errorMessage,
    stack: errorStack,
    ...context,
  });

  // Enviar a Sentry (solo en producción)
  if (config.enabled) {
    Sentry.captureException(error, {
      tags: {
        page: context?.page,
        component: context?.component,
        action: context?.action,
      },
      user: context?.userId
        ? {
            id: context.userId,
            email: context.userEmail,
          }
        : undefined,
      extra: context?.metadata,
    });
  }

  // Debug console
  if (config.debug) {
    console.error('🔴 Error captured:', {
      message: errorMessage,
      context,
    });
  }
}

// Capturar warning
export function captureWarning(message: string, context?: ErrorContext): void {
  logger.warn('Warning captured', {
    message,
    ...context,
  });

  if (config.enabled) {
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        page: context?.page,
        component: context?.component,
      },
      extra: context?.metadata,
    });
  }
}

// Capturar info
export function captureInfo(message: string, context?: ErrorContext): void {
  logger.info('Info captured', {
    message,
    ...context,
  });

  if (config.debug) {
    console.info('ℹ️', message, context);
  }
}

// Set user context
export function setUserContext(user: {
  id: string;
  email: string;
  name?: string;
  companyId?: string;
}): void {
  if (!config.enabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  Sentry.setTag('companyId', user.companyId);
}

// Clear user context
export function clearUserContext(): void {
  if (!config.enabled) return;
  Sentry.setUser(null);
}

// Breadcrumb (rastro de navegación)
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (!config.enabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

// Capturar excepción no manejada
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Errores no capturados
  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, {
      page: window.location.pathname,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, {
      page: window.location.pathname,
      metadata: {
        type: 'unhandledrejection',
      },
    });
  });

  // Console.error tracking (opcional)
  const originalError = console.error;
  console.error = function (...args) {
    originalError.apply(console, args);

    if (config.enabled && args.length > 0) {
      const message = args
        .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ');

      captureWarning(`Console error: ${message}`, {
        page: window.location.pathname,
      });
    }
  };
}

// Helper para try/catch con reporte automático
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    captureError(error as Error, context);
    return null;
  }
}

// Decorator para funciones
export function trackErrors(context?: ErrorContext) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        captureError(error as Error, {
          ...context,
          component: target.constructor.name,
          action: propertyKey,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// React Error Boundary helper
export function logErrorToService(error: Error, errorInfo: { componentStack: string }): void {
  captureError(error, {
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

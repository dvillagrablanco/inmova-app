/**
 * 🚑 PROTOCOLO ZERO-HEADACHE - Error Handling
 * 
 * Utilidades para manejo de errores resiliente y autogestionado.
 * Diseñado para "Solo Founders" que necesitan dormir tranquilo.
 * 
 * @module error-handling
 */

import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';

/**
 * Contexto adicional para errores
 */
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Severidad del error para clasificación
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Clasificación de errores por tipo
 */
export const ErrorTypes = {
  // Críticos (afectan core business)
  PAYMENT_FAILED: 'payment_failed',
  CONTRACT_CREATION_FAILED: 'contract_creation_failed',
  AUTH_FAILED: 'auth_failed',
  DATA_LOSS: 'data_loss',
  
  // Altos (afectan funcionalidad importante)
  API_ERROR: 'api_error',
  DATABASE_ERROR: 'database_error',
  FILE_UPLOAD_FAILED: 'file_upload_failed',
  
  // Medios (degradan experiencia)
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  
  // Bajos (no afectan usuario)
  CACHE_MISS: 'cache_miss',
  OPTIONAL_FEATURE_FAILED: 'optional_feature_failed',
} as const;

/**
 * Configuración de severidad por tipo de error
 */
const ERROR_SEVERITY_MAP: Record<string, ErrorSeverity> = {
  [ErrorTypes.PAYMENT_FAILED]: 'critical',
  [ErrorTypes.CONTRACT_CREATION_FAILED]: 'critical',
  [ErrorTypes.AUTH_FAILED]: 'critical',
  [ErrorTypes.DATA_LOSS]: 'critical',
  [ErrorTypes.API_ERROR]: 'high',
  [ErrorTypes.DATABASE_ERROR]: 'high',
  [ErrorTypes.FILE_UPLOAD_FAILED]: 'high',
  [ErrorTypes.VALIDATION_ERROR]: 'medium',
  [ErrorTypes.NETWORK_ERROR]: 'medium',
  [ErrorTypes.CACHE_MISS]: 'low',
  [ErrorTypes.OPTIONAL_FEATURE_FAILED]: 'low',
};

/**
 * Captura y reporta un error a Sentry con contexto enriquecido
 * 
 * @example
 * ```typescript
 * try {
 *   await processPayment(orderId);
 * } catch (error) {
 *   captureError(error, {
 *     errorType: ErrorTypes.PAYMENT_FAILED,
 *     context: {
 *       userId: session.user.id,
 *       action: 'process_payment',
 *       metadata: { orderId, amount: 1000 }
 *     }
 *   });
 *   throw error; // Re-throw si es crítico
 * }
 * ```
 */
export function captureError(
  error: unknown,
  options: {
    errorType?: string;
    context?: ErrorContext;
    severity?: ErrorSeverity;
    fingerprint?: string[];
  } = {}
): void {
  const {
    errorType,
    context,
    severity = errorType ? ERROR_SEVERITY_MAP[errorType] : 'medium',
    fingerprint,
  } = options;

  // Log local para debugging
  console.error('🚨 [Error Captured]', {
    type: errorType,
    severity,
    context,
    error: error instanceof Error ? error.message : String(error),
  });

  // Enviar a Sentry con contexto enriquecido
  Sentry.withScope(scope => {
    // Severidad
    scope.setLevel(severityToSentryLevel(severity));

    // Tags para filtrado
    if (errorType) {
      scope.setTag('error_type', errorType);
    }
    scope.setTag('severity', severity);

    // Contexto de usuario
    if (context?.userId || context?.userEmail) {
      scope.setUser({
        id: context.userId,
        email: context.userEmail,
      });
    }

    // Contexto de acción
    if (context?.action) {
      scope.setContext('action', {
        name: context.action,
        metadata: context.metadata || {},
      });
    }

    // Fingerprint para agrupar errores similares
    if (fingerprint) {
      scope.setFingerprint(fingerprint);
    }

    // Capturar error
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
}

/**
 * Convierte severidad interna a nivel de Sentry
 */
function severityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
  const map: Record<ErrorSeverity, Sentry.SeverityLevel> = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'fatal',
  };
  return map[severity];
}

/**
 * Wrapper para Server Actions con manejo de errores automático
 * 
 * @example
 * ```typescript
 * export const createContract = withErrorHandling(
 *   async (data: ContractData) => {
 *     // Tu lógica aquí
 *     const contract = await prisma.contract.create({ data });
 *     return { success: true, contract };
 *   },
 *   {
 *     errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
 *     action: 'create_contract',
 *     userFriendlyMessage: 'No pudimos crear el contrato. Por favor, inténtalo de nuevo en unos minutos.',
 *   }
 * );
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    errorType?: string;
    action?: string;
    userFriendlyMessage?: string;
    shouldRethrow?: boolean;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Capturar contexto del error
      const context: ErrorContext = {
        action: options.action,
        metadata: {
          args: args.map(arg => {
            // No loggear passwords o tokens
            if (typeof arg === 'object' && arg !== null) {
              const { password, token, secret, ...safe } = arg as any;
              return safe;
            }
            return arg;
          }),
        },
      };

      // Reportar a Sentry
      captureError(error, {
        errorType: options.errorType,
        context,
      });

      // Respuesta para el usuario
      if (options.shouldRethrow !== false) {
        throw error;
      }

      return {
        success: false,
        error: options.userFriendlyMessage || 'Algo salió mal. Por favor, inténtalo de nuevo.',
      };
    }
  }) as T;
}

/**
 * Mensajes de error amigables por tipo
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  [ErrorTypes.PAYMENT_FAILED]:
    'No pudimos procesar el pago. Verifica tus datos de pago e inténtalo de nuevo.',
  [ErrorTypes.CONTRACT_CREATION_FAILED]:
    'No pudimos crear el contrato. Por favor, inténtalo de nuevo en unos minutos.',
  [ErrorTypes.AUTH_FAILED]:
    'No pudimos iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.',
  [ErrorTypes.API_ERROR]:
    'Hubo un problema de conexión. Por favor, inténtalo de nuevo en unos minutos.',
  [ErrorTypes.DATABASE_ERROR]:
    'Hubo un problema guardando los datos. Por favor, inténtalo de nuevo.',
  [ErrorTypes.FILE_UPLOAD_FAILED]:
    'No pudimos subir el archivo. Verifica que sea menor a 10MB e inténtalo de nuevo.',
  [ErrorTypes.VALIDATION_ERROR]:
    'Algunos datos no son válidos. Por favor, revisa el formulario.',
  [ErrorTypes.NETWORK_ERROR]:
    'No hay conexión a internet. Verifica tu red e inténtalo de nuevo.',
};

/**
 * Obtiene mensaje amigable para un tipo de error
 */
export function getUserFriendlyMessage(errorType: string, defaultMessage?: string): string {
  return USER_FRIENDLY_MESSAGES[errorType] || defaultMessage || 'Algo salió mal. Por favor, inténtalo de nuevo.';
}

/**
 * Muestra un toast de error con mensaje amigable
 * 
 * @example
 * ```typescript
 * try {
 *   await uploadFile(file);
 * } catch (error) {
 *   showErrorToast(ErrorTypes.FILE_UPLOAD_FAILED, error);
 * }
 * ```
 */
export function showErrorToast(errorType: string, error?: unknown): void {
  const message = getUserFriendlyMessage(errorType);
  
  // En desarrollo, mostrar más detalles
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    toast.error(message, {
      description: error.message,
      duration: 5000,
    });
  } else {
    toast.error(message, {
      duration: 4000,
    });
  }
}

/**
 * Helper para errores de validación con Zod
 * 
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   throw new ValidationError(result.error.errors);
 * }
 * ```
 */
export class ValidationError extends Error {
  constructor(
    public errors: Array<{ path: (string | number)[]; message: string }>
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }

  toUserMessage(): string {
    const firstError = this.errors[0];
    return firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Datos inválidos';
  }
}

/**
 * Helper para errores de negocio (no técnicos)
 * 
 * @example
 * ```typescript
 * if (user.balance < amount) {
 *   throw new BusinessError('Saldo insuficiente');
 * }
 * ```
 */
export class BusinessError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * Verifica si un error es recuperable (no crítico)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof BusinessError) return true;
  if (error instanceof ValidationError) return true;
  
  // Errores de red son recuperables
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('aborted')
    ) {
      return true;
    }
  }
  
  return false;
}

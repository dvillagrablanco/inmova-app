/**
 * Clases de Error Personalizadas para Integraciones Externas
 * Proporciona jerarquía de errores tipados para mejor manejo y logging
 */

export class IntegrationError extends Error {
  public readonly statusCode: number;
  public readonly provider: string;
  public readonly retryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    provider: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.context = context;

    // Mantener stack trace en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      provider: this.provider,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      stack: this.stack,
    };
  }
}

// =============================================================================
// STRIPE ERRORS
// =============================================================================

export class StripeError extends IntegrationError {
  constructor(
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, 'Stripe', statusCode, retryable, context);
    this.name = 'StripeError';
  }
}

export class StripeAuthError extends StripeError {
  constructor(message: string = 'Stripe authentication failed', context?: Record<string, any>) {
    super(message, 401, false, context);
    this.name = 'StripeAuthError';
  }
}

export class StripeRateLimitError extends StripeError {
  constructor(message: string = 'Stripe rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, context); // Retryable
    this.name = 'StripeRateLimitError';
  }
}

export class StripeWebhookError extends StripeError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, false, context);
    this.name = 'StripeWebhookError';
  }
}

export class StripeServerError extends StripeError {
  constructor(message: string = 'Stripe server error', context?: Record<string, any>) {
    super(message, 503, true, context); // Retryable
    this.name = 'StripeServerError';
  }
}

// =============================================================================
// ZUCCHETTI ERRORS
// =============================================================================

export class ZucchettiError extends IntegrationError {
  constructor(
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, 'Zucchetti', statusCode, retryable, context);
    this.name = 'ZucchettiError';
  }
}

export class ZucchettiAuthError extends ZucchettiError {
  constructor(message: string = 'Zucchetti authentication failed', context?: Record<string, any>) {
    super(message, 401, false, context);
    this.name = 'ZucchettiAuthError';
  }
}

export class ZucchettiRateLimitError extends ZucchettiError {
  constructor(message: string = 'Zucchetti rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, context);
    this.name = 'ZucchettiRateLimitError';
  }
}

export class ZucchettiValidationError extends ZucchettiError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, false, context);
    this.name = 'ZucchettiValidationError';
  }
}

export class ZucchettiServerError extends ZucchettiError {
  constructor(message: string = 'Zucchetti server error', context?: Record<string, any>) {
    super(message, 503, true, context);
    this.name = 'ZucchettiServerError';
  }
}

// =============================================================================
// CONTASIMPLE ERRORS
// =============================================================================

export class ContaSimpleError extends IntegrationError {
  constructor(
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, 'ContaSimple', statusCode, retryable, context);
    this.name = 'ContaSimpleError';
  }
}

export class ContaSimpleAuthError extends ContaSimpleError {
  constructor(
    message: string = 'ContaSimple authentication failed',
    context?: Record<string, any>
  ) {
    super(message, 401, false, context);
    this.name = 'ContaSimpleAuthError';
  }
}

export class ContaSimpleRateLimitError extends ContaSimpleError {
  constructor(message: string = 'ContaSimple rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, context);
    this.name = 'ContaSimpleRateLimitError';
  }
}

export class ContaSimpleValidationError extends ContaSimpleError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, false, context);
    this.name = 'ContaSimpleValidationError';
  }
}

export class ContaSimpleServerError extends ContaSimpleError {
  constructor(message: string = 'ContaSimple server error', context?: Record<string, any>) {
    super(message, 503, true, context);
    this.name = 'ContaSimpleServerError';
  }
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Determina si un error es retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof IntegrationError) {
    return error.retryable;
  }

  // Errores de red son generalmente retryables
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Errores 5xx son retryables
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // 429 (rate limit) es retryable
  if (error.response?.status === 429) {
    return true;
  }

  return false;
}

/**
 * Convierte un error de axios u otro tipo en IntegrationError apropiado
 */
export function normalizeIntegrationError(
  error: any,
  provider: 'Stripe' | 'Zucchetti' | 'ContaSimple',
  context?: Record<string, any>
): IntegrationError {
  // Si ya es un IntegrationError, retornarlo
  if (error instanceof IntegrationError) {
    return error;
  }

  const statusCode = error.response?.status || 500;
  const message = error.response?.data?.message || error.message || 'Unknown error';
  const retryable = isRetryableError(error);

  const fullContext = {
    ...context,
    originalError: error.message,
    statusCode,
    url: error.config?.url,
    method: error.config?.method,
  };

  switch (provider) {
    case 'Stripe':
      if (statusCode === 401 || statusCode === 403) {
        return new StripeAuthError(message, fullContext);
      } else if (statusCode === 429) {
        return new StripeRateLimitError(message, fullContext);
      } else if (statusCode >= 500) {
        return new StripeServerError(message, fullContext);
      }
      return new StripeError(message, statusCode, retryable, fullContext);

    case 'Zucchetti':
      if (statusCode === 401 || statusCode === 403) {
        return new ZucchettiAuthError(message, fullContext);
      } else if (statusCode === 429) {
        return new ZucchettiRateLimitError(message, fullContext);
      } else if (statusCode === 400) {
        return new ZucchettiValidationError(message, fullContext);
      } else if (statusCode >= 500) {
        return new ZucchettiServerError(message, fullContext);
      }
      return new ZucchettiError(message, statusCode, retryable, fullContext);

    case 'ContaSimple':
      if (statusCode === 401 || statusCode === 403) {
        return new ContaSimpleAuthError(message, fullContext);
      } else if (statusCode === 429) {
        return new ContaSimpleRateLimitError(message, fullContext);
      } else if (statusCode === 400) {
        return new ContaSimpleValidationError(message, fullContext);
      } else if (statusCode >= 500) {
        return new ContaSimpleServerError(message, fullContext);
      }
      return new ContaSimpleError(message, statusCode, retryable, fullContext);

    default:
      return new IntegrationError(message, provider, statusCode, retryable, fullContext);
  }
}

/**
 * Helper para loguear errores de integración de manera consistente
 */
export function logIntegrationError(error: IntegrationError, logger: any) {
  logger.error(`[${error.provider}] ${error.name}: ${error.message}`, {
    provider: error.provider,
    statusCode: error.statusCode,
    retryable: error.retryable,
    context: error.context,
    stack: error.stack,
  });
}

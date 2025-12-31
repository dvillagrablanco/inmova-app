/**
 * API v1 - Error Handling
 * Errores estandarizados para API REST
 */

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized - Invalid or missing API key/token') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden - Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends APIError {
  constructor(public fields: Record<string, string>) {
    super('Validation failed', 400, 'VALIDATION_ERROR', fields);
  }
}

export class RateLimitError extends APIError {
  constructor(
    public limit: number,
    public reset: number,
    message: string = 'Rate limit exceeded'
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', {
      limit,
      reset: new Date(reset).toISOString(),
    });
  }
}

export class InternalError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Handler genérico de errores para API v1
 */
export function handleAPIError(error: unknown): {
  statusCode: number;
  body: any;
} {
  // APIError custom
  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      body: error.toJSON(),
    };
  }

  // Prisma errors
  if (error instanceof Error && error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      return {
        statusCode: 409,
        body: {
          error: 'Resource already exists',
          code: 'DUPLICATE_ERROR',
          details: prismaError.meta,
        },
      };
    }

    if (prismaError.code === 'P2025') {
      return {
        statusCode: 404,
        body: {
          error: 'Resource not found',
          code: 'NOT_FOUND',
        },
      };
    }
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    const fields: Record<string, string> = {};

    for (const issue of zodError.issues) {
      const path = issue.path.join('.');
      fields[path] = issue.message;
    }

    return {
      statusCode: 400,
      body: {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: fields,
      },
    };
  }

  // Error genérico
  console.error('[API v1 Error]:', error);

  return {
    statusCode: 500,
    body: {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && {
        debug: error instanceof Error ? error.message : String(error),
      }),
    },
  };
}

/**
 * API Error Handler
 * 
 * Wrapper para API Routes que captura errores automáticamente y los reporta.
 * También proporciona funciones helper para respuestas de error consistentes.
 * 
 * @usage
 * // En tu API route:
 * import { withErrorHandler, apiError } from '@/lib/api-error-handler';
 * 
 * export const GET = withErrorHandler(async (request) => {
 *   // Tu lógica aquí
 *   if (!data) {
 *     throw apiError('Datos no encontrados', 404);
 *   }
 *   return NextResponse.json({ data });
 * });
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackError, ErrorSource, ErrorSeverity } from '@/lib/error-tracker';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// ============================================================================
// TIPOS
// ============================================================================

export interface APIErrorOptions {
  code?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
}

export class APIError extends Error {
  public statusCode: number;
  public code?: string;
  public severity: ErrorSeverity;
  public metadata?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    options: APIErrorOptions = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = options.code;
    this.severity = options.severity || (statusCode >= 500 ? 'high' : 'medium');
    this.metadata = options.metadata;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Crea un error de API con código de estado
 */
export function apiError(
  message: string,
  statusCode: number = 500,
  options: APIErrorOptions = {}
): APIError {
  return new APIError(message, statusCode, options);
}

/**
 * Errores comunes pre-configurados
 */
export const errors = {
  unauthorized: () => apiError('No autenticado', 401, { code: 'UNAUTHORIZED' }),
  forbidden: () => apiError('No tienes permisos', 403, { code: 'FORBIDDEN' }),
  notFound: (resource = 'Recurso') => apiError(`${resource} no encontrado`, 404, { code: 'NOT_FOUND' }),
  badRequest: (message = 'Datos inválidos') => apiError(message, 400, { code: 'BAD_REQUEST' }),
  conflict: (message = 'Conflicto de datos') => apiError(message, 409, { code: 'CONFLICT' }),
  internal: (message = 'Error interno del servidor') => apiError(message, 500, { code: 'INTERNAL_ERROR', severity: 'critical' }),
  validation: (details: string) => apiError(`Validación fallida: ${details}`, 400, { code: 'VALIDATION_ERROR' }),
};

// ============================================================================
// WRAPPER PRINCIPAL
// ============================================================================

type APIHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrapper que captura errores de API routes automáticamente
 */
export function withErrorHandler(handler: APIHandler): APIHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const startTime = Date.now();
    
    try {
      // Ejecutar el handler original
      const response = await handler(request, context);
      return response;
    } catch (error: any) {
      // Extraer información del error
      const isAPIError = error instanceof APIError;
      const statusCode = isAPIError ? error.statusCode : 500;
      const message = error.message || 'Error interno del servidor';
      const severity: ErrorSeverity = isAPIError ? error.severity : (statusCode >= 500 ? 'high' : 'medium');
      
      // Obtener contexto de la request
      const url = request.url;
      const method = request.method;
      const route = new URL(request.url).pathname;
      
      // Obtener info del usuario si está disponible
      let userId: string | undefined;
      let userEmail: string | undefined;
      let userRole: string | undefined;
      
      try {
        const session = await getServerSession(authOptions);
        userId = session?.user?.id;
        userEmail = session?.user?.email || undefined;
        userRole = session?.user?.role;
      } catch {
        // Ignorar errores de sesión
      }
      
      // Extraer headers relevantes
      const userAgent = request.headers.get('user-agent') || undefined;
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 undefined;
      
      // Extraer body si es posible (solo para POST/PUT/PATCH)
      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await request.clone().json();
          // Sanitizar datos sensibles
          if (body.password) body.password = '[REDACTED]';
          if (body.token) body.token = '[REDACTED]';
          if (body.apiKey) body.apiKey = '[REDACTED]';
        } catch {
          // Ignorar si no es JSON
        }
      }
      
      // Query params
      const query = Object.fromEntries(new URL(request.url).searchParams);
      
      // Trackear el error
      await trackError(error, {
        source: 'api' as ErrorSource,
        severity,
        url,
        route,
        method,
        body,
        query,
        userId,
        userEmail,
        userRole,
        userAgent,
        ip,
        metadata: {
          processingTime: Date.now() - startTime,
          code: isAPIError ? error.code : undefined,
          ...(isAPIError ? error.metadata : {}),
        },
      });
      
      // Log en consola (para debugging local)
      console.error(`[API Error] ${method} ${route}:`, {
        message,
        statusCode,
        severity,
        processingTime: Date.now() - startTime,
      });
      
      // Respuesta de error
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: isAPIError ? error.code : 'INTERNAL_ERROR',
          // Solo incluir stack en desarrollo
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
        { status: statusCode }
      );
    }
  };
}

// ============================================================================
// MIDDLEWARE PARA TODAS LAS RUTAS
// ============================================================================

/**
 * Middleware que se puede usar en middleware.ts para capturar errores globalmente
 */
export async function errorTrackingMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: any) {
    // Solo trackear si es un error de API
    if (request.nextUrl.pathname.startsWith('/api/')) {
      await trackError(error, {
        source: 'api',
        route: request.nextUrl.pathname,
        method: request.method,
      });
    }
    throw error;
  }
}

export default withErrorHandler;

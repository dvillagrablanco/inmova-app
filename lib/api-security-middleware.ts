/**
 * Middleware de seguridad global para APIs
 * Centraliza: auth, rate limiting, validación, error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { withRateLimit, RATE_LIMITS } from './rate-limiting';
import { z, ZodSchema } from 'zod';
import logger from './logger';

interface SecureAPIOptions {
  requireAuth?: boolean;
  rateLimit?: keyof typeof RATE_LIMITS;
  validate?: ZodSchema;
  allowedRoles?: string[];
}

/**
 * Wrapper seguro para API handlers
 * Aplica: rate limiting, auth, validación, error handling
 */
export async function secureAPI(
  req: NextRequest,
  handler: (session?: any, validated?: any) => Promise<NextResponse>,
  options: SecureAPIOptions = {}
): Promise<NextResponse> {
  try {
    // 1. Rate Limiting (si está especificado)
    if (options.rateLimit) {
      return await withRateLimit(req, async () => {
        return executeSecureHandler(req, handler, options);
      });
    }

    return executeSecureHandler(req, handler, options);
  } catch (error) {
    return handleAPIError(error);
  }
}

async function executeSecureHandler(
  req: NextRequest,
  handler: (session?: any, validated?: any) => Promise<NextResponse>,
  options: SecureAPIOptions
): Promise<NextResponse> {
  let session = null;

  // 2. Autenticación (si es requerida)
  if (options.requireAuth) {
    session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      logger.warn('Unauthorized API access attempt', {
        path: req.nextUrl.pathname,
        ip: req.headers.get('x-forwarded-for'),
      });
      
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // 3. Verificar roles (si están especificados)
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const userRole = (session.user as any).role;
      
      if (!options.allowedRoles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          path: req.nextUrl.pathname,
          userId: session.user.id,
          userRole,
          requiredRoles: options.allowedRoles,
        });
        
        return NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }
    }
  }

  // 4. Validación de input (si está especificada)
  let validated = undefined;
  
  if (options.validate) {
    try {
      const contentType = req.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await req.json();
        validated = options.validate.parse(body);
      } else if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData();
        const body = Object.fromEntries(formData);
        validated = options.validate.parse(body);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error', {
          path: req.nextUrl.pathname,
          errors,
        });
        
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  }

  // 5. Ejecutar handler
  return await handler(session, validated);
}

/**
 * Manejo centralizado de errores de API
 */
export function handleAPIError(error: unknown): NextResponse {
  // Log del error (siempre)
  logger.error('API Error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Errores de validación Zod
  if (error instanceof z.ZodError) {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return NextResponse.json(
      {
        error: 'Datos inválidos',
        details: errors,
      },
      { status: 400 }
    );
  }

  // Errores de Prisma (sin exponer internals)
  if (error instanceof Error && error.message.includes('Prisma')) {
    return NextResponse.json(
      {
        error: 'Error de base de datos',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
        }),
      },
      { status: 500 }
    );
  }

  // Error genérico
  return NextResponse.json(
    {
      error: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    },
    { status: 500 }
  );
}

/**
 * Helper para crear respuestas exitosas consistentes
 */
export function apiSuccess<T>(data: T, options?: { status?: number; message?: string }) {
  return NextResponse.json(
    {
      success: true,
      ...(options?.message && { message: options.message }),
      data,
    },
    { status: options?.status || 200 }
  );
}

/**
 * Helper para sanitizar outputs (eliminar campos sensibles)
 */
export function sanitizeOutput<T extends Record<string, any>>(
  obj: T,
  fieldsToRemove: string[] = ['password', 'passwordHash', 'token', 'secret']
): Partial<T> {
  const sanitized = { ...obj };
  
  fieldsToRemove.forEach((field) => {
    delete sanitized[field];
  });
  
  return sanitized;
}

/**
 * API v1 - Middleware
 * Autenticación, Rate Limiting, CORS, Logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasScope, AuthContext } from './auth';
import { checkRateLimit } from './rate-limiter';
import { UnauthorizedError, ForbiddenError, RateLimitError, handleAPIError } from './errors';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export interface APIRequest extends NextRequest {
  auth?: AuthContext;
}

/**
 * Wrapper de API v1 con autenticación, rate limiting, y logging
 */
export function withAPIv1(
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>,
  options: {
    requiredScopes?: string[];
    skipAuth?: boolean;
    skipRateLimit?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    let authContext: AuthContext | undefined;
    let statusCode = 200;

    try {
      // 1. CORS Headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      // Handle OPTIONS (preflight)
      if (req.method === 'OPTIONS') {
        return NextResponse.json({}, { status: 200, headers: corsHeaders });
      }

      // 2. Autenticación (si no está skip)
      if (!options.skipAuth) {
        const authorization = req.headers.get('authorization');
        authContext = await authenticateRequest(authorization);

        if (!authContext.valid) {
          throw new UnauthorizedError();
        }

        // 3. Verificar scopes requeridos
        if (options.requiredScopes && options.requiredScopes.length > 0) {
          const hasAllScopes = options.requiredScopes.every((scope) =>
            hasScope(authContext!, scope)
          );

          if (!hasAllScopes) {
            throw new ForbiddenError(
              `Missing required scopes: ${options.requiredScopes.join(', ')}`
            );
          }
        }

        // 4. Rate limiting (si no está skip)
        if (!options.skipRateLimit && authContext.companyId) {
          const rateLimitResult = await checkRateLimit(
            authContext.companyId,
            authContext.rateLimit
          );

          if (!rateLimitResult.success) {
            throw new RateLimitError(rateLimitResult.limit, rateLimitResult.reset);
          }

          // Agregar headers de rate limit
          corsHeaders['X-RateLimit-Limit'] = rateLimitResult.limit.toString();
          corsHeaders['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
          corsHeaders['X-RateLimit-Reset'] = new Date(rateLimitResult.reset).toISOString();
        }
      }

      // 5. Ejecutar handler
      const response = await handler(req, authContext!);
      statusCode = response.status;

      // 6. Agregar CORS headers a la respuesta
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }

      // 7. Agregar header de response time
      const responseTime = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${responseTime}ms`);

      return response;
    } catch (error) {
      // Manejar error
      const errorResponse = handleAPIError(error);
      statusCode = errorResponse.statusCode;

      return NextResponse.json(errorResponse.body, {
        status: errorResponse.statusCode,
      });
    } finally {
      // 8. Log del request (async, no bloqueante)
      const responseTime = Date.now() - startTime;

      logAPIRequest({
        companyId: authContext?.companyId,
        method: req.method,
        path: req.nextUrl.pathname,
        statusCode,
        responseTime,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      }).catch((err) => {
        logger.error('Error logging API request:', err);
      });
    }
  };
}

/**
 * Log de request a la API
 */
async function logAPIRequest(params: {
  companyId?: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent?: string;
}) {
  try {
    // Solo loggear si la empresa existe (autenticado)
    if (!params.companyId) {
      return;
    }

    await prisma.apiLog.create({
      data: {
        companyId: params.companyId,
        method: params.method,
        path: params.path,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        rateLimitHit: params.statusCode === 429,
      },
    });
  } catch (error) {
    logger.error('Error creating API log:', error);
  }
}

/**
 * Parsear query parameters de paginación
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Crear respuesta paginada
 */
export function createPaginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

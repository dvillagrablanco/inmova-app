/**
 * Endpoint de prueba para rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkRateLimit } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-rate-limit
 * Endpoint de prueba para verificar rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Get identifier from session or IP
    const identifier = session?.user?.id || request.headers.get('x-forwarded-for') || 'anonymous';

    // Aplicar rate limit de API autenticado o público
    const limitType = session?.user ? 'AUTHENTICATED_API' : 'PUBLIC_API';
    const rateLimitResult = await checkRateLimit(limitType, identifier);

    // Si excedió el límite
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset.getTime() - Date.now()) / 1000
      );

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Request permitido
    logger.info(`Rate limit check passed for ${identifier}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Request successful',
        identifier,
        limitType,
        rateLimit: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset.toISOString(),
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        },
      }
    );
  } catch (error: any) {
    logger.error('Error in rate limit test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

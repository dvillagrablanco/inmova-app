import { NextRequest, NextResponse } from 'next/server';
import {
  generateCsrfToken as generateCSRFToken,
  getCsrfTokenFromCookies as getCSRFTokenFromCookie,
  setCsrfCookie as setCSRFCookie,
} from '@/lib/csrf-protection';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 * Genera o devuelve el token CSRF actual
 */
export async function GET(request: NextRequest) {
  try {
    // Intentar obtener token existente
    let token = getCSRFTokenFromCookie(request);

    // Si no existe, generar uno nuevo
    if (!token) {
      token = generateCSRFToken();
      logger.info('Generated new CSRF token');
    }

    const response = NextResponse.json({
      token,
      success: true,
    });

    // Configurar la cookie con el token
    setCSRFCookie(response, token);

    return response;
  } catch (error) {
    logger.error('Error generating CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        success: false,
      },
      { status: 500 }
    );
  }
}

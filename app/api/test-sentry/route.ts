import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de prueba para verificar que Sentry está capturando errores correctamente
 * 
 * GET /api/test-sentry
 * 
 * Fuerza un error y lo envía a Sentry con contexto de prueba.
 * Verifica en https://sentry.io/issues/ después de 1-2 minutos.
 */
export async function GET() {
  try {
    // Forzar un error de prueba
    throw new Error('Test error from Sentry endpoint - This is a test!');
  } catch (error) {
    // Capturar el error en Sentry con contexto
    Sentry.captureException(error, {
      tags: {
        test: 'true',
        endpoint: '/api/test-sentry',
        timestamp: new Date().toISOString(),
      },
      contexts: {
        test: {
          purpose: 'Verify Sentry integration',
          expected: 'Error should appear in Sentry dashboard',
        },
      },
    });
    
    // También usar el logger
    Sentry.logger.error('Test error logged', {
      message: 'This is a test error to verify Sentry integration',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Error successfully captured by Sentry',
      instructions: [
        'Check your Sentry dashboard at: https://sentry.io/issues/',
        'Wait 1-2 minutes for the error to appear',
        'Look for: "Test error from Sentry endpoint"',
        'Verify tags: test=true, endpoint=/api/test-sentry',
      ],
      note: 'If you see this response, Sentry captured the error successfully!',
    });
  }
}

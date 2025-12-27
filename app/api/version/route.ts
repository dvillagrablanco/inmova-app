export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getVersionInfo, getVersionHeaders } from '@/lib/version';

/**
 * GET /api/version
 * 
 * Endpoint público que retorna información de la versión actual del deployment.
 * Útil para verificar que se está ejecutando la última versión.
 */
export async function GET() {
  const versionInfo = getVersionInfo();
  const versionHeaders = getVersionHeaders();

  const response = NextResponse.json(
    {
      success: true,
      data: versionInfo,
      message: 'Version information retrieved successfully',
    },
    {
      status: 200,
      headers: {
        ...versionHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );

  return response;
}

/**
 * HEAD /api/version
 * 
 * Permite verificar rápidamente la versión sin descargar el body completo
 */
export async function HEAD() {
  const versionHeaders = getVersionHeaders();

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...versionHeaders,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

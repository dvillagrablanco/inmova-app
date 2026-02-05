import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedProvider } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/auth-proveedor/me - Obtener proveedor autenticado
export async function GET(req: NextRequest) {
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { success: false, proveedor: null, error: 'No autenticado' }
      );
    }

    return NextResponse.json({
      success: true,
      proveedor: provider,
    });
  } catch (error) {
    logger.error('Error al obtener proveedor autenticado:', error);
    return NextResponse.json({
      success: false,
      proveedor: null,
      error: 'Error al obtener datos del proveedor',
    });
  }
}

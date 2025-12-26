import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedProvider } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/auth-proveedor/me - Obtener proveedor autenticado
export async function GET(req: NextRequest) {
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      proveedor: provider,
    });
  } catch (error) {
    logger.error('Error al obtener proveedor autenticado:', error);
    return NextResponse.json({ error: 'Error al obtener datos del proveedor' }, { status: 500 });
  }
}

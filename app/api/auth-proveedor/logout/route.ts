import { NextRequest, NextResponse } from 'next/server';
import { removeProviderAuthCookie } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/auth-proveedor/logout - Logout para proveedores
export async function POST(req: NextRequest) {
  try {
    // Eliminar cookie de autenticación
    removeProviderAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    logger.error('Error en logout de proveedor:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}

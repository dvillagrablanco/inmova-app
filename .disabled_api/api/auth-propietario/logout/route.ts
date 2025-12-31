import { NextRequest, NextResponse } from 'next/server';
import { removeOwnerAuthCookie } from '@/lib/owner-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/auth-propietario/logout - Logout para propietarios
export async function POST(req: NextRequest) {
  try {
    // Eliminar cookie de autenticación
    removeOwnerAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    logger.error('Error en logout de propietario:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}

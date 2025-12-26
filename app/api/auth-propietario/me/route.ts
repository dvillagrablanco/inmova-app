import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOwner } from '@/lib/owner-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/auth-propietario/me - Obtener datos del propietario autenticado
export async function GET(req: NextRequest) {
  try {
    const owner = await getAuthenticatedOwner();

    if (!owner) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      owner,
    });
  } catch (error) {
    logger.error('Error al obtener propietario autenticado:', error);
    return NextResponse.json({ error: 'Error al obtener datos del propietario' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener huertos urbanos disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Devolvemos array vacío - sin datos ficticios
    // Los huertos se crearán cuando haya edificios configurados con esta funcionalidad
    return NextResponse.json([]);
  } catch (error: any) {
    logger.error('[Circular Economy Gardens GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener huertos' },
      { status: 500 }
    );
  }
}

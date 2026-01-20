import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener parcelas del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Devolvemos array vacío - sin datos ficticios
    // Las parcelas aparecerán cuando el usuario reserve alguna
    return NextResponse.json([]);
  } catch (error: any) {
    logger.error('[Circular Economy My Plots GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener parcelas' },
      { status: 500 }
    );
  }
}

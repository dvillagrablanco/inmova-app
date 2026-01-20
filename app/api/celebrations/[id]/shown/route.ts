export const dynamic = 'force-dynamic';

/**
 * API: /api/celebrations/[id]/shown
 * Marcar una celebración como mostrada
 * 
 * PATCH: Marcar como mostrada
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { markCelebrationAsShown } from '@/lib/celebration-service';

import logger from '@/lib/logger';
interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/celebrations/[id]/shown
 * Marca una celebración como mostrada
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    const result = await markCelebrationAsShown(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al marcar celebración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      celebration: result.celebration,
    });
  } catch (error) {
    logger.error('[API] Error in PATCH /api/celebrations/[id]/shown:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

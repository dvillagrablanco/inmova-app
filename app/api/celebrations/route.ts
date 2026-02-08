export const dynamic = 'force-dynamic';

/**
 * API: /api/celebrations
 * Gestión de celebraciones de logros del usuario
 * 
 * GET: Obtener celebraciones pendientes
 * POST: Crear una celebración (solo sistema)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import {
  getPendingCelebrations,
  createCelebration,
  CreateCelebrationParams,
} from '@/lib/celebration-service';

/**
 * GET /api/celebrations
 * Obtiene las celebraciones pendientes del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const result = await getPendingCelebrations(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al obtener celebraciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      celebrations: result.celebrations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API] Error in GET /api/celebrations:', { message });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/celebrations
 * Crea una nueva celebración (solo sistema)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const params: CreateCelebrationParams = {
      userId: body.userId || session.user.id,
      companyId: body.companyId || session.user.companyId || '',
      type: body.type,
      title: body.title,
      message: body.message,
      badgeText: body.badgeText,
      badgeColor: body.badgeColor,
      actionLabel: body.actionLabel,
      actionRoute: body.actionRoute,
    };

    // Validaciones
    if (!params.type || !params.title || !params.message) {
      return NextResponse.json(
        { error: 'Type, title y message son requeridos' },
        { status: 400 }
      );
    }

    const result = await createCelebration(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear celebración' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { celebration: result.celebration },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API] Error in POST /api/celebrations:', { message });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: GET /api/user/active-modules
 * Devuelve los módulos activos (preferredModules) del usuario autenticado.
 * Usado por el sistema de onboarding para filtrar tours y tareas según
 * los módulos que el usuario tiene habilitados.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const prisma = await getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredModules: true,
        company: {
          select: {
            businessVertical: true,
          },
        },
      },
    });

    const activeModules = (user?.preferredModules as string[]) || [];
    const businessVertical = user?.company?.businessVertical || null;

    return NextResponse.json({
      success: true,
      activeModules,
      businessVertical,
    });
  } catch (error: any) {
    logger.error('[API] Error in GET /api/user/active-modules:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

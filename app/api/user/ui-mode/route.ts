export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { UIMode } from '@prisma/client';

/**
 * PUT /api/user/ui-mode
 * 
 * Actualiza el modo de interfaz del usuario (simple, standard, advanced)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { uiMode } = body;

    // Validar que el modo sea válido
    if (!['simple', 'standard', 'advanced'].includes(uiMode)) {
      return NextResponse.json(
        { error: 'Modo UI inválido. Debe ser: simple, standard o advanced' },
        { status: 400 }
      );
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { uiMode: uiMode as UIMode },
      select: {
        id: true,
        name: true,
        email: true,
        uiMode: true,
        experienceLevel: true,
        techSavviness: true,
        portfolioSize: true,
      },
    });

    console.log(`[UI Mode] Usuario ${session.user.id} cambió a modo: ${uiMode}`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Modo de interfaz actualizado a: ${uiMode}`,
    });
  } catch (error: any) {
    console.error('[UI Mode API Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar modo de interfaz', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/ui-mode
 * 
 * Obtiene el modo de interfaz actual del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        uiMode: true,
        experienceLevel: true,
        techSavviness: true,
        portfolioSize: true,
        preferredModules: true,
        hiddenModules: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: user,
    });
  } catch (error: any) {
    console.error('[UI Mode API Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener modo de interfaz', details: error.message },
      { status: 500 }
    );
  }
}

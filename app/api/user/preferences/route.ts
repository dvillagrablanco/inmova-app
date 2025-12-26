import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/user/preferences
 *
 * Actualiza las preferencias de módulos del usuario:
 * - preferredModules: Módulos favoritos (se muestran destacados en sidebar)
 * - hiddenModules: Módulos ocultos (no se muestran en sidebar)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { preferredModules, hiddenModules } = body;

    const updateData: any = {};

    if (Array.isArray(preferredModules)) {
      updateData.preferredModules = preferredModules;
    }

    if (Array.isArray(hiddenModules)) {
      updateData.hiddenModules = hiddenModules;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron preferencias para actualizar' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        preferredModules: true,
        hiddenModules: true,
      },
    });

    console.log(`[Preferences] Usuario ${session.user.id} actualizó preferencias`);

    return NextResponse.json({
      success: true,
      preferences: {
        preferredModules: updatedUser.preferredModules,
        hiddenModules: updatedUser.hiddenModules,
      },
      message: 'Preferencias actualizadas correctamente',
    });
  } catch (error: any) {
    console.error('[Preferences API Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/preferences
 *
 * Obtiene las preferencias de módulos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredModules: true,
        hiddenModules: true,
        uiMode: true,
        experienceLevel: true,
        techSavviness: true,
        portfolioSize: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        preferredModules: user.preferredModules || [],
        hiddenModules: user.hiddenModules || [],
      },
      profile: {
        uiMode: user.uiMode,
        experienceLevel: user.experienceLevel,
        techSavviness: user.techSavviness,
        portfolioSize: user.portfolioSize,
      },
    });
  } catch (error: any) {
    console.error('[Preferences API Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener preferencias', details: error.message },
      { status: 500 }
    );
  }
}

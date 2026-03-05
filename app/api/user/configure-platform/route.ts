import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/user/configure-platform
 * Aplica la configuración de la plataforma resultado del onboarding IA.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      experienceLevel,
      techSavviness,
      uiMode,
      businessVertical,
      preferredModules,
      hiddenModules,
    } = body;

    const updateData: any = {};

    if (experienceLevel && ['principiante', 'intermedio', 'avanzado'].includes(experienceLevel)) {
      updateData.experienceLevel = experienceLevel;
    }
    if (techSavviness && ['bajo', 'medio', 'alto'].includes(techSavviness)) {
      updateData.techSavviness = techSavviness;
    }
    if (uiMode && ['simple', 'standard', 'advanced'].includes(uiMode)) {
      updateData.uiMode = uiMode;
    }
    if (businessVertical) {
      updateData.businessVertical = businessVertical;
    }
    if (Array.isArray(preferredModules)) {
      updateData.preferredModules = preferredModules;
    }
    if (Array.isArray(hiddenModules)) {
      updateData.hiddenModules = hiddenModules;
    }

    // Mark onboarding as complete
    updateData.hasCompletedOnboarding = true;
    updateData.onboardingCompletedAt = new Date();

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        experienceLevel: true,
        techSavviness: true,
        uiMode: true,
        businessVertical: true,
        preferredModules: true,
        hasCompletedOnboarding: true,
      },
    });

    logger.info('[Platform Config] Applied', {
      userId: session.user.id,
      config: updateData,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    logger.error('[Platform Config Error]:', error);
    return NextResponse.json({ error: 'Error aplicando configuración' }, { status: 500 });
  }
}

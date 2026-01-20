import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Verificar estado de onboarding del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: true,
        createdAt: true,
        onboardingProgressDetailed: {
          select: {
            completedSteps: true,
            currentStep: true,
            isCompleted: true,
            setupVersion: true,
            lastUpdated: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Determinar si es usuario nuevo (menos de 7 días)
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isNewUser = daysSinceCreation <= 7;

    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      onboardingCompletedAt: user.onboardingCompletedAt,
      isNewUser,
      daysSinceCreation,
      setupProgress: user.onboardingProgressDetailed || {
        completedSteps: [],
        currentStep: 0,
        isCompleted: false,
        setupVersion: null
      }
    });
  } catch (error: any) {
    logger.error('[Onboarding Status Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado de onboarding' },
      { status: 500 }
    );
  }
}

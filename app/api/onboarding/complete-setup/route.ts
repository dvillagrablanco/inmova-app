import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Marcar setup como completado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { completedTasks, setupVersion } = body;

    // Actualizar usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date()
      }
    });

    // Guardar progreso detallado
    await prisma.userOnboardingProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        completedSteps: completedTasks || [],
        isCompleted: true,
        setupVersion: setupVersion || '1.0',
        lastUpdated: new Date()
      },
      update: {
        completedSteps: completedTasks || [],
        isCompleted: true,
        setupVersion: setupVersion || '1.0',
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración inicial completada'
    });
  } catch (error: any) {
    console.error('[Complete Setup Error]:', error);
    return NextResponse.json(
      { error: 'Error completando configuración' },
      { status: 500 }
    );
  }
}

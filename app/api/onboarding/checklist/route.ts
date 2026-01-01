import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obtener progreso del checklist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar progreso en DB
    const userProgress = await prisma.userOnboardingProgress.findUnique({
      where: { userId: session.user.id },
      select: {
        completedSteps: true,
        currentStep: true,
        isCompleted: true,
        lastUpdated: true
      }
    });

    return NextResponse.json({
      checklist: userProgress?.completedSteps || [],
      currentStep: userProgress?.currentStep || 0,
      isCompleted: userProgress?.isCompleted || false
    });
  } catch (error: any) {
    console.error('[Checklist GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo progreso' },
      { status: 500 }
    );
  }
}

// POST - Guardar progreso del checklist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { completedItems } = body;

    if (!Array.isArray(completedItems)) {
      return NextResponse.json(
        { error: 'completedItems debe ser un array' },
        { status: 400 }
      );
    }

    // Actualizar progreso
    const userProgress = await prisma.userOnboardingProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        completedSteps: completedItems,
        currentStep: completedItems.length,
        isCompleted: completedItems.length >= 5,
        lastUpdated: new Date()
      },
      update: {
        completedSteps: completedItems,
        currentStep: completedItems.length,
        isCompleted: completedItems.length >= 5,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      progress: userProgress
    });
  } catch (error: any) {
    console.error('[Checklist POST Error]:', error);
    return NextResponse.json(
      { error: 'Error guardando progreso' },
      { status: 500 }
    );
  }
}

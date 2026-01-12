import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authTenantOptions } from '@/lib/auth-tenant-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener el estado del onboarding
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authTenantOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).id;

    // Buscar o crear el registro de onboarding
    let onboarding = await prisma.tenantOnboarding.findUnique({
      where: { tenantId }
    });

    if (!onboarding) {
      // Crear registro de onboarding
      onboarding = await prisma.tenantOnboarding.create({
        data: {
          tenantId,
          steps: []
        }
      });
    }

    return NextResponse.json(onboarding);
  } catch (error: any) {
    logger.error('Error al obtener onboarding', {
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Error al obtener el onboarding' },
      { status: 500 }
    );
  }
}

// POST - Completar el onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authTenantOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).id;
    const body = await request.json();

    // Actualizar el onboarding como completado
    const onboarding = await prisma.tenantOnboarding.upsert({
      where: { tenantId },
      update: {
        completed: body.completed || true,
        completedAt: new Date()
      },
      create: {
        tenantId,
        completed: body.completed || true,
        completedAt: new Date(),
        steps: []
      }
    });

    logger.info('Onboarding completado', {
      tenantId,
      onboardingId: onboarding.id
    });

    return NextResponse.json(onboarding);
  } catch (error: any) {
    logger.error('Error al completar onboarding', {
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Error al completar el onboarding' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar el progreso del onboarding
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authTenantOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).id;
    const body = await request.json();
    const { currentStep } = body;

    if (typeof currentStep !== 'number') {
      return NextResponse.json(
        { error: 'currentStep debe ser un número' },
        { status: 400 }
      );
    }

    // Actualizar el paso actual
    const onboarding = await prisma.tenantOnboarding.upsert({
      where: { tenantId },
      update: {
        currentStep
      },
      create: {
        tenantId,
        currentStep,
        steps: []
      }
    });

    return NextResponse.json(onboarding);
  } catch (error: any) {
    logger.error('Error al actualizar onboarding', {
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Error al actualizar el onboarding' },
      { status: 500 }
    );
  }
}

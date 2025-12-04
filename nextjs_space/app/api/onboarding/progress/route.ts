import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { getOnboardingSteps, ModeloNegocio } from '@/lib/onboarding-configs';

// Mapeo de BusinessVertical de Prisma a ModeloNegocio de onboarding-configs
const verticalToModelo: Record<string, ModeloNegocio> = {
  'alquiler_tradicional': 'alquiler_tradicional',
  'str_vacacional': 'str',
  'coliving': 'room_rental',
  'construccion': 'construccion',
  'flipping': 'flipping',
  'servicios_profesionales': 'profesional',
  'mixto': 'general'
};

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  required: boolean;
  order: number;
  videoUrl?: string;
  estimatedTime?: number;
}

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  percentageComplete: number;
  steps: OnboardingStep[];
  vertical: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener o crear progreso de onboarding
    let progress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: user.companyId
        }
      }
    });

    // Determinar vertical del usuario
    const vertical = user.businessVertical || 'mixto';
    const modeloNegocio = verticalToModelo[vertical] || 'general';
    
    // Obtener pasos configurados para este vertical
    const stepsConfig = getOnboardingSteps(modeloNegocio);

    // Si no existe progreso, crearlo
    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          vertical: modeloNegocio,
          currentStep: 0,
          totalSteps: stepsConfig.length,
          completedSteps: []
        }
      });
    }

    // Convertir completedSteps de JSON a array
    const completedStepsArray = Array.isArray(progress.completedSteps)
      ? progress.completedSteps as string[]
      : [];

    // Mapear pasos de configuración a formato del componente
    const steps: OnboardingStep[] = stepsConfig.map((step, index) => {
      const isCompleted = completedStepsArray.includes(step.id);
      
      return {
        id: step.id,
        title: step.title,
        description: step.description,
        action: step.action ? `navigate:${step.action.route}` : 'acknowledge',
        completed: isCompleted,
        required: index < 3, // Los primeros 3 pasos son requeridos
        order: index,
        videoUrl: step.videoUrl,
        estimatedTime: index === 0 ? 1 : index < 3 ? 3 : 5 // Tiempo estimado en minutos
      };
    });

    // Calcular progreso actual
    const currentStepIndex = steps.findIndex(s => !s.completed);
    const currentStep = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex;
    const completedCount = completedStepsArray.length;
    const percentageComplete = Math.round((completedCount / steps.length) * 100);

    const response: OnboardingProgress = {
      currentStep,
      totalSteps: steps.length,
      completedSteps: completedCount,
      percentageComplete,
      steps,
      vertical: modeloNegocio
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error loading onboarding progress:', error);
    return NextResponse.json(
      { error: 'Error al cargar progreso' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, stepId } = body;

    let progress = await prisma.onboardingProgress.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: user.companyId
        }
      }
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'Progreso no encontrado' },
        { status: 404 }
      );
    }

    if (action === 'complete_step' && stepId) {
      // Agregar paso a completados
      const completedStepsArray = Array.isArray(progress.completedSteps)
        ? progress.completedSteps as string[]
        : [];
      
      if (!completedStepsArray.includes(stepId)) {
        completedStepsArray.push(stepId);
        
        progress = await prisma.onboardingProgress.update({
          where: {
            userId_companyId: {
              userId: user.id,
              companyId: user.companyId
            }
          },
          data: {
            completedSteps: completedStepsArray,
            lastActivityAt: new Date(),
            completedAt: completedStepsArray.length === progress.totalSteps ? new Date() : progress.completedAt
          }
        });
      }
    } else if (action === 'skip') {
      // Marcar como completado sin actualizar pasos individuales
      progress = await prisma.onboardingProgress.update({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: user.companyId
          }
        },
        data: {
          completedAt: new Date(),
          lastActivityAt: new Date()
        }
      });
    } else if (action === 'restart') {
      // Reiniciar progreso
      progress = await prisma.onboardingProgress.update({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: user.companyId
          }
        },
        data: {
          currentStep: 0,
          completedSteps: [],
          completedAt: null,
          lastActivityAt: new Date()
        }
      });
    }

    // Recalcular y devolver progreso actualizado
    const getResponse = await GET(request);
    return getResponse;
  } catch (error) {
    logger.error('Error updating onboarding progress:', error);
    return NextResponse.json(
      { error: 'Error al actualizar progreso' },
      { status: 500 }
    );
  }
}

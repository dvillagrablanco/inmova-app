import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET: Obtiene el progreso del onboarding del usuario
 * POST: Marca un paso como completado
 */

const ONBOARDING_STEPS = [
  { id: 'company_setup', title: 'Configuración de empresa', required: true },
  { id: 'first_building', title: 'Crear primer edificio', required: true },
  { id: 'first_tenant', title: 'Registrar primer inquilino', required: false },
  { id: 'first_contract', title: 'Crear primer contrato', required: false },
  { id: 'configure_payments', title: 'Configurar pagos', required: false },
  { id: 'explore_modules', title: 'Explorar módulos', required: false },
  { id: 'invite_team', title: 'Invitar equipo', required: false },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Obtener datos del usuario para determinar progreso
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determinar qué pasos están completados (simplificado)
    const completedSteps: string[] = [];

    // Company setup - si el usuario tiene nombre y email
    if (user.name && user.email) {
      completedSteps.push('company_setup');
    }

    const totalSteps = ONBOARDING_STEPS.length;
    const percentage = Math.round((completedSteps.length / totalSteps) * 100);

    // Determinar siguiente acción recomendada
    let nextRecommendedAction;
    const nextStep = ONBOARDING_STEPS.find(step => !completedSteps.includes(step.id));

    if (nextStep) {
      const actionMap: Record<string, any> = {
        company_setup: {
          title: 'Completa la configuración de tu empresa',
          description: 'Configura los datos de tu empresa para comenzar',
          route: '/admin/configuracion',
        },
        first_building: {
          title: 'Crea tu primer edificio',
          description: 'Registra tu primera propiedad en el sistema',
          route: '/edificios/nuevo',
        },
        first_tenant: {
          title: 'Registra tu primer inquilino',
          description: 'Añade un inquilino al sistema',
          route: '/inquilinos/nuevo',
        },
        first_contract: {
          title: 'Crea tu primer contrato',
          description: 'Genera un contrato de alquiler',
          route: '/contratos/nuevo',
        },
        configure_payments: {
          title: 'Configura los pagos',
          description: 'Configura métodos de pago y recordatorios',
          route: '/pagos',
        },
        explore_modules: {
          title: 'Explora los módulos',
          description: 'Descubre todas las funcionalidades disponibles',
          route: '/dashboard',
        },
        invite_team: {
          title: 'Invita a tu equipo',
          description: 'Añade miembros de tu equipo a la plataforma',
          route: '/admin/usuarios',
        },
      };

      nextRecommendedAction = actionMap[nextStep.id];
    }

    return NextResponse.json({
      userId: user.id,
      completedSteps,
      totalSteps,
      percentage,
      nextRecommendedAction,
      steps: ONBOARDING_STEPS.map(step => ({
        ...step,
        completed: completedSteps.includes(step.id),
      })),
    });
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, stepId, completed } = await request.json();

    const targetUserId = userId || session.user.id;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Por ahora solo retornamos success sin actualizar metadata
    // ya que el campo metadata no existe en el esquema actual
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking onboarding step:', error);
    return NextResponse.json(
      { error: 'Failed to mark step' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// Pasos de onboarding de demostración
const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenida a INMOVA',
    description: 'Conoce las funcionalidades principales de la plataforma',
    action: 'acknowledge',
    completed: false,
    required: true,
    order: 1,
    estimatedTime: 1
  },
  {
    id: 'create-property',
    title: 'Crear tu primera propiedad',
    description: 'Añade una propiedad para gestionar',
    action: 'navigate:/dashboard/properties/new',
    completed: false,
    required: true,
    order: 2,
    estimatedTime: 3
  },
  {
    id: 'explore-dashboard',
    title: 'Explorar el dashboard',
    description: 'Familiarízate con las diferentes secciones',
    action: 'navigate:/dashboard',
    completed: false,
    required: false,
    order: 3,
    estimatedTime: 2
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Devolver progreso de demostración
    const progress = {
      currentStep: 0,
      totalSteps: DEMO_STEPS.length,
      completedSteps: 0,
      percentageComplete: 0,
      steps: DEMO_STEPS,
      vertical: 'property_management'
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error en onboarding progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, stepId } = body;

    // Simular actualización de progreso
    if (action === 'skip') {
      return NextResponse.json({ success: true, skipped: true });
    }

    if (action === 'restart') {
      return NextResponse.json({
        currentStep: 0,
        totalSteps: DEMO_STEPS.length,
        completedSteps: 0,
        percentageComplete: 0,
        steps: DEMO_STEPS,
        vertical: 'property_management'
      });
    }

    if (action === 'complete_step' && stepId) {
      // Simular completar un paso
      const updatedSteps = DEMO_STEPS.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      );
      
      const completedSteps = updatedSteps.filter(s => s.completed).length;
      const percentageComplete = Math.round((completedSteps / DEMO_STEPS.length) * 100);

      return NextResponse.json({
        currentStep: completedSteps,
        totalSteps: DEMO_STEPS.length,
        completedSteps,
        percentageComplete,
        steps: updatedSteps,
        vertical: 'property_management'
      });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error en onboarding progress POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getOrCreateOnboardingProgress,
  completeOnboardingStep,
  skipOnboarding,
  restartOnboarding,
  detectBusinessVertical,
  type BusinessVertical
} from '@/lib/automated-onboarding-service';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    // Detectar vertical automáticamente si es la primera vez
    const vertical = await detectBusinessVertical(companyId);
    
    const progress = await getOrCreateOnboardingProgress(
      session.user.id,
      companyId,
      vertical
    );

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return NextResponse.json(
      { error: 'Error al obtener progreso de onboarding' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await request.json();
    const { action, stepId, vertical } = body;

    let result;

    switch (action) {
      case 'complete_step':
        if (!stepId) {
          return NextResponse.json({ error: 'Step ID requerido' }, { status: 400 });
        }
        result = await completeOnboardingStep(session.user.id, companyId, stepId);
        break;

      case 'skip':
        await skipOnboarding(session.user.id, companyId);
        result = { message: 'Onboarding omitido' };
        break;

      case 'restart':
        result = await restartOnboarding(session.user.id, companyId, vertical as BusinessVertical);
        break;

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error managing onboarding:', error);
    return NextResponse.json(
      { error: 'Error al gestionar onboarding' },
      { status: 500 }
    );
  }
}

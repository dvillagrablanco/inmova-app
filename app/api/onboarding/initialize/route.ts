export const dynamic = 'force-dynamic';

/**
 * API: POST /api/onboarding/initialize
 * Inicializa las tareas de onboarding para un usuario
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { initializeOnboardingTasks } from '@/lib/onboarding-service';

export async function POST(request: Request) {
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { vertical } = await request.json();

    if (!vertical) {
      return NextResponse.json(
        { error: 'Vertical de negocio requerido' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Inicializar tareas
    const tasks = await initializeOnboardingTasks(userId, companyId, vertical);

    return NextResponse.json({
      success: true,
      tasks,
      message: `Inicializadas ${tasks.length} tareas de onboarding`
    });
  } catch (error: any) {
    console.error('Error inicializando onboarding:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

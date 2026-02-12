export const dynamic = 'force-dynamic';

/**
 * API: POST /api/onboarding/task/complete
 * Marca una tarea de onboarding como completada
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { completeOnboardingTask } from '@/lib/onboarding-service';

import logger from '@/lib/logger';
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

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId requerido' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;

    // Completar tarea
    await completeOnboardingTask(userId, companyId, taskId);

    return NextResponse.json({
      success: true,
      message: 'Tarea completada'
    });
  } catch (error: any) {
    logger.error('Error completando tarea de onboarding:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

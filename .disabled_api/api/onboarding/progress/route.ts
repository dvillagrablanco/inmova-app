/**
 * API: GET /api/onboarding/progress
 * Obtiene el progreso del onboarding del usuario
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOnboardingProgress } from '@/lib/onboarding-service';

export async function GET(request: Request) {
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Obtener progreso
    const progress = await getOnboardingProgress(userId, companyId);

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Error obteniendo progreso de onboarding:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

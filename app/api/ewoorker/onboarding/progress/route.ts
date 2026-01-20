/**
 * API: Progreso de onboarding eWoorker
 * GET /api/ewoorker/onboarding/progress
 * POST /api/ewoorker/onboarding/progress (completar paso)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerOnboarding } from '@/lib/ewoorker-onboarding-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

/**
 * GET: Obtener progreso de onboarding
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const progress = await ewoorkerOnboarding.getProgress(session.user.id);

    if (!progress) {
      return NextResponse.json({ error: 'No se encontró perfil eWoorker' }, { status: 404 });
    }

    return NextResponse.json({ progress });
  } catch (error: any) {
    logger.error('[EWOORKER_ONBOARDING_PROGRESS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const completeStepSchema = z.object({
  stepId: z.string(),
  data: z.record(z.any()).optional(),
});

/**
 * POST: Completar un paso de onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { stepId, data } = completeStepSchema.parse(body);

    const result = await ewoorkerOnboarding.completeStep(session.user.id, stepId, data);

    if (!result.success) {
      return NextResponse.json({ error: 'Error completando paso' }, { status: 400 });
    }

    // Obtener progreso actualizado
    const progress = await ewoorkerOnboarding.getProgress(session.user.id);

    return NextResponse.json({
      success: true,
      nextStep: result.nextStep,
      progress,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[EWOORKER_ONBOARDING_PROGRESS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

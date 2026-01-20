/**
 * API Endpoint: Feedback de Matching
 * 
 * POST /api/v1/matching/feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { recordMatchFeedback } from '@/lib/matching-feedback-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const feedbackSchema = z.object({
  matchId: z.string(),
  feedbackType: z.enum(['ACCEPTED', 'VIEWED', 'REJECTED', 'IGNORED']),
  metadata: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { matchId, feedbackType, metadata } = validation.data;

    await recordMatchFeedback(matchId, feedbackType, metadata);

    return NextResponse.json({
      success: true,
      message: 'Feedback registrado exitosamente',
    });

  } catch (error: any) {
    logger.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Error registrando feedback', message: error.message },
      { status: 500 }
    );
  }
}

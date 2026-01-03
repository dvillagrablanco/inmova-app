/**
 * API Route: Track A/B Test Event
 * 
 * POST /api/v1/ab-tests/track
 * 
 * Registra eventos de A/B tests (views, clicks, conversions).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackABTestEvent } from '@/lib/ab-testing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackEventSchema = z.object({
  testId: z.string(),
  eventType: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = trackEventSchema.parse(body);

    await trackABTestEvent({
      testId: validated.testId,
      userId: session.user.id,
      eventType: validated.eventType,
      metadata: validated.metadata,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error tracking A/B test event:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

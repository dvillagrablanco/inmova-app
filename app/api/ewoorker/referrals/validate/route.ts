/**
 * API Route: /api/ewoorker/referrals/validate
 *
 * POST: Validar código de referido
 */

import { NextRequest, NextResponse } from 'next/server';
import { ewoorkerReferral } from '@/lib/ewoorker-referral-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const validateSchema = z.object({
  code: z.string().min(6).max(12),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateSchema.parse(body);

    const result = await ewoorkerReferral.validateCode(validated.code);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      referrerName: result.referrerName,
      discount: result.discount,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, error: 'Código inválido' }, { status: 400 });
    }
    logger.error('[API EwoorkerReferrals Validate] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

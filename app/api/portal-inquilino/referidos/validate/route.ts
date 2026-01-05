/**
 * API para validar código de referido
 * POST: Validar y usar código al registrarse
 */
import { NextRequest, NextResponse } from 'next/server';
import { tenantReferrals } from '@/lib/tenant-referral-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const validateSchema = z.object({
  code: z.string().min(6),
  tenantId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateSchema.parse(body);

    const result = await tenantReferrals.useReferralCode(validated.code, validated.tenantId);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Código de referido inválido o expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `¡Bienvenido! ${result.referrerName} te ha referido. Ganaste ${result.pointsAwarded} puntos.`,
    });
  } catch (error: any) {
    console.error('[Validate Referral Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message || 'Error validando código' }, { status: 500 });
  }
}

/**
 * API Endpoint: Validar fortaleza de contraseña
 * POST /api/auth/validate-password
 *
 * Evaluar la fortaleza de una contraseña en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { evaluatePasswordStrength, validatePasswordPolicy } from '@/lib/password-strength';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(1),
  userInputs: z.array(z.string()).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar entrada
    const validated = passwordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { password, userInputs = [] } = validated.data;

    // Evaluar fortaleza
    const strengthResult = evaluatePasswordStrength(password, userInputs);
    const policyResult = validatePasswordPolicy(password);

    return NextResponse.json({
      success: true,
      data: {
        strength: strengthResult,
        policy: policyResult,
        meets_requirements: strengthResult.valid && policyResult.valid,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al validar contraseña' }, { status: 500 });
  }
}

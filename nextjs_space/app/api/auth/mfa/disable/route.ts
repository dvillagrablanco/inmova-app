/**
 * API Endpoint: Deshabilitar MFA
 * POST /api/auth/mfa/disable
 * 
 * Desactiva MFA para el usuario (requiere código de verificación)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { disableMFA } from '@/lib/mfa-service';
import logger from '@/lib/logger';
import { z } from 'zod';

const disableSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Código debe ser 6 dígitos'),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validar entrada
    const validated = disableSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = validated.data;
    const userId = session.user.id;

    // Deshabilitar MFA
    await disableMFA(userId, code);

    logger.info('MFA disabled', { userId });

    return NextResponse.json({
      success: true,
      message: 'MFA deshabilitado correctamente',
    });
  } catch (error: any) {
    logger.error('Error disabling MFA', { error: error.message });

    return NextResponse.json(
      { error: error.message || 'Error al deshabilitar MFA' },
      { status: 400 }
    );
  }
}

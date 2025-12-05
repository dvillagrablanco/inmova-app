/**
 * API Endpoint: Verificar y activar MFA (paso 2)
 * POST /api/auth/mfa/verify
 * 
 * Verifica el código TOTP y activa MFA para el usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { verifyAndEnableMFA } from '@/lib/mfa-service';
import logger from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Código debe ser 6 dígitos'),
  secret: z.string().min(16),
  backupCodes: z.array(z.string()).min(10).max(10),
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
    const validated = verifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { code, secret, backupCodes } = validated.data;
    const userId = session.user.id;

    // Verificar y activar MFA
    const result = await verifyAndEnableMFA(userId, code, secret, backupCodes);

    logger.info('MFA enabled successfully', { userId });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    logger.error('Error verifying MFA', { error: error.message });

    return NextResponse.json(
      { error: error.message || 'Error al verificar MFA' },
      { status: 400 }
    );
  }
}

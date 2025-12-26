/**
 * API Endpoint: Regenerar códigos de respaldo
 * POST /api/auth/mfa/regenerate-codes
 *
 * Genera nuevos códigos de respaldo (requiere verificación MFA)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { regenerateBackupCodes } from '@/lib/mfa-service';
import logger from '@/lib/logger';
import { z } from 'zod';

const regenerateSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'Código debe ser 6 dígitos'),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Validar entrada
    const validated = regenerateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = validated.data;
    const userId = session.user.id;

    // Regenerar códigos
    const newCodes = await regenerateBackupCodes(userId, code);

    logger.info('Backup codes regenerated', { userId });

    return NextResponse.json({
      success: true,
      data: {
        backupCodes: newCodes,
      },
    });
  } catch (error: any) {
    logger.error('Error regenerating backup codes', { error: error.message });

    return NextResponse.json(
      { error: error.message || 'Error al regenerar códigos' },
      { status: 400 }
    );
  }
}

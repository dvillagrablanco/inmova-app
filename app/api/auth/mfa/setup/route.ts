/**
 * API Endpoint: Configurar MFA (paso 1)
 * POST /api/auth/mfa/setup
 * 
 * Genera secret TOTP, QR code y backup codes para configurar MFA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { setupMFA } from '@/lib/mfa-service';
import logger from '@/lib/logger';

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

    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // Generar datos de configuración MFA
    const mfaSetup = await setupMFA(userId, userEmail);

    logger.info('MFA setup initiated', { userId });

    return NextResponse.json({
      success: true,
      data: {
        qrCode: mfaSetup.qrCode,
        secret: mfaSetup.secret,
        backupCodes: mfaSetup.backupCodes,
      },
    });
  } catch (error: any) {
    logger.error('Error in MFA setup', { error: error.message });

    return NextResponse.json(
      { error: error.message || 'Error al configurar MFA' },
      { status: 400 }
    );
  }
}

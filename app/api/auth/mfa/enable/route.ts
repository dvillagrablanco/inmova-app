/**
 * POST /api/auth/mfa/enable
 * Inicia el proceso de activación de MFA
 * Genera secret TOTP, QR code y backup codes
 *
 * IMPORTANTE: MFA solo disponible para Super Admins
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMFASetup } from '@/lib/mfa-helpers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo Super Admins pueden activar MFA
    if (session.user.role !== 'super_admin') {
      logger.warn('[MFA] Unauthorized MFA enable attempt', {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json(
        { error: 'Solo los Super Administradores pueden activar MFA' },
        { status: 403 }
      );
    }

    // Verificar si ya tiene MFA habilitado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA ya está habilitado para este usuario' },
        { status: 400 }
      );
    }

    // Generar setup completo de MFA
    const mfaSetup = await generateMFASetup(user.email, 'INMOVA');

    // Guardar secret encriptado TEMPORALMENTE
    // No activar MFA hasta que el usuario verifique el código
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaSecret: mfaSetup.secret.encrypted,
        mfaBackupCodes: mfaSetup.hashedBackupCodes,
        mfaRecoveryCodes: mfaSetup.backupCodes.length,
        // mfaEnabled: false, // No activar todavía
      },
    });

    logger.info('[MFA] Setup initiated', {
      userId: session.user.id,
      email: user.email,
    });

    // Retornar datos para el cliente
    return NextResponse.json({
      success: true,
      qrCode: mfaSetup.qrCode,
      secret: mfaSetup.secret.base32, // Para entry manual
      backupCodes: mfaSetup.backupCodes, // Mostrar UNA VEZ
    });
  } catch (error: any) {
    logger.error('[MFA] Error enabling MFA:', error);
    return NextResponse.json({ error: 'Error al iniciar MFA' }, { status: 500 });
  }
}

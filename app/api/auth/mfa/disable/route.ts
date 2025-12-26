/**
 * DELETE /api/auth/mfa/disable
 * Desactiva MFA para el usuario actual
 *
 * Body: { password: string } - Requiere password para confirmar
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password requerido para desactivar MFA' },
        { status: 400 }
      );
    }

    // Verificar password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        mfaEnabled: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA no está habilitado' }, { status: 400 });
    }

    // Verificar password
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      logger.warn('[MFA] Invalid password for MFA disable', {
        userId: session.user.id,
        email: user.email,
      });
      return NextResponse.json({ error: 'Password incorrecto' }, { status: 401 });
    }

    // Desactivar MFA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        mfaVerifiedAt: null,
        mfaRecoveryCodes: 10, // Reset counter
      },
    });

    logger.info('[MFA] MFA disabled', {
      userId: session.user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA desactivado correctamente',
    });
  } catch (error: any) {
    logger.error('[MFA] Error disabling MFA:', error);
    return NextResponse.json({ error: 'Error al desactivar MFA' }, { status: 500 });
  }
}

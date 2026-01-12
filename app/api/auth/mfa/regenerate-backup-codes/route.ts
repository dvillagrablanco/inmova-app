/**
 * POST /api/auth/mfa/regenerate-backup-codes
 * Regenera códigos de backup para MFA
 * Requiere password para confirmar
 * 
 * Body: { password: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateBackupCodes, hashBackupCode } from '@/lib/mfa-helpers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { password } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password requerido para regenerar códigos' },
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
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA no está habilitado' },
        { status: 400 }
      );
    }
    
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      logger.warn('[MFA] Invalid password for backup code regeneration', {
        userId: session.user.id,
        email: user.email,
      });
      return NextResponse.json(
        { error: 'Password incorrecto' },
        { status: 401 }
      );
    }
    
    // Generar nuevos backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));
    
    // Actualizar en DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaBackupCodes: hashedBackupCodes,
        mfaRecoveryCodes: backupCodes.length,
      },
    });
    
    logger.info('[MFA] Backup codes regenerated', {
      userId: session.user.id,
      email: user.email,
    });
    
    return NextResponse.json({
      success: true,
      backupCodes, // Mostrar UNA VEZ
      message: 'Códigos de backup regenerados. Guárdalos en un lugar seguro.',
    });
  } catch (error: any) {
    logger.error('[MFA] Error regenerating backup codes:', error);
    return NextResponse.json(
      { error: 'Error al regenerar códigos' },
      { status: 500 }
    );
  }
}

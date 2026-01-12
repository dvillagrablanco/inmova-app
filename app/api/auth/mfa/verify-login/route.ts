/**
 * POST /api/auth/mfa/verify-login
 * Verifica código TOTP o backup code durante el login
 * 
 * Este endpoint se llama DESPUÉS de validar email+password
 * pero ANTES de crear la sesión NextAuth
 * 
 * Body: { userId: string, token: string, isBackupCode?: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyTOTPToken,
  verifyBackupCode,
  hashBackupCode,
} from '@/lib/mfa-helpers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token, isBackupCode = false } = body;
    
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'userId y token requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener datos MFA del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        mfaRecoveryCodes: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA no está habilitado para este usuario' },
        { status: 400 }
      );
    }
    
    // Verificar si es backup code o TOTP
    if (isBackupCode) {
      // Verificar backup code
      if (user.mfaBackupCodes.length === 0) {
        return NextResponse.json(
          { error: 'No hay códigos de backup disponibles' },
          { status: 400 }
        );
      }
      
      const result = verifyBackupCode(token, user.mfaBackupCodes);
      
      if (!result || !result.valid) {
        logger.warn('[MFA] Invalid backup code', {
          userId: user.id,
          email: user.email,
        });
        return NextResponse.json(
          { error: 'Código de backup incorrecto' },
          { status: 400 }
        );
      }
      
      // Remover backup code usado
      const newBackupCodes = user.mfaBackupCodes.filter(
        (_, index) => index !== result.usedCodeIndex
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaBackupCodes: newBackupCodes,
          mfaRecoveryCodes: newBackupCodes.length,
        },
      });
      
      logger.info('[MFA] Backup code used successfully', {
        userId: user.id,
        email: user.email,
        remaining: newBackupCodes.length,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Código de backup válido',
        remaining: newBackupCodes.length,
      });
    } else {
      // Verificar TOTP
      const isValid = verifyTOTPToken(token, user.mfaSecret, true);
      
      if (!isValid) {
        logger.warn('[MFA] Invalid TOTP token during login', {
          userId: user.id,
          email: user.email,
        });
        return NextResponse.json(
          { error: 'Código incorrecto' },
          { status: 400 }
        );
      }
      
      logger.info('[MFA] TOTP verified successfully during login', {
        userId: user.id,
        email: user.email,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Código válido',
      });
    }
  } catch (error: any) {
    logger.error('[MFA] Error verifying MFA login:', error);
    return NextResponse.json(
      { error: 'Error al verificar código MFA' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/mfa/verify
 * Verifica el código TOTP y activa MFA
 * 
 * Body: { token: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { verifyTOTPToken } from '@/lib/mfa-helpers';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
    const { token } = body;
    
    if (!token || typeof token !== 'string' || token.length !== 6) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }
    
    // Obtener secret del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaSecret: true,
        mfaEnabled: true,
        email: true,
      },
    });
    
    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA no configurado. Inicie el proceso con /api/auth/mfa/enable' },
        { status: 400 }
      );
    }
    
    // Verificar código TOTP
    const isValid = verifyTOTPToken(token, user.mfaSecret, true);
    
    if (!isValid) {
      logger.warn('[MFA] Invalid TOTP token', {
        userId: session.user.id,
        email: user.email,
      });
      return NextResponse.json(
        { error: 'Código incorrecto' },
        { status: 400 }
      );
    }
    
    // Activar MFA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });
    
    logger.info('[MFA] MFA activated successfully', {
      userId: session.user.id,
      email: user.email,
    });
    
    return NextResponse.json({
      success: true,
      message: 'MFA activado correctamente',
    });
  } catch (error: any) {
    logger.error('[MFA] Error verifying MFA:', error);
    return NextResponse.json(
      { error: 'Error al verificar código MFA' },
      { status: 500 }
    );
  }
}

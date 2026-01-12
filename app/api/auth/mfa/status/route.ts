/**
 * GET /api/auth/mfa/status
 * Obtiene el estado MFA del usuario actual
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaVerifiedAt: true,
        mfaRecoveryCodes: true,
        role: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      mfaEnabled: user.mfaEnabled,
      mfaVerifiedAt: user.mfaVerifiedAt,
      backupCodesRemaining: user.mfaRecoveryCodes,
      canEnableMFA: user.role === 'super_admin',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener estado MFA' },
      { status: 500 }
    );
  }
}

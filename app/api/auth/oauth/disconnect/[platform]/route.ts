/**
 * API Endpoint: Desconectar OAuth
 * 
 * POST /api/auth/oauth/disconnect/[platform]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { disconnectAccount } from '@/lib/oauth-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID no encontrado' },
        { status: 400 }
      );
    }

    // 2. Validar plataforma
    const platform = params.platform.toUpperCase();
    if (!['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma no soportada' },
        { status: 400 }
      );
    }

    // 3. Desconectar cuenta
    const success = await disconnectAccount(companyId, platform as any);

    if (!success) {
      return NextResponse.json(
        { error: 'Error desconectando cuenta' },
        { status: 500 }
      );
    }

    logger.info(`🔌 Account disconnected: ${platform}`, { companyId });

    return NextResponse.json({
      success: true,
      message: `${platform} desconectado exitosamente`,
    });

  } catch (error: any) {
    logger.error('❌ Error disconnecting OAuth account:', error);

    return NextResponse.json(
      {
        error: 'Error desconectando cuenta',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * API Endpoint: Iniciar OAuth Flow
 * 
 * GET /api/auth/oauth/connect/[platform]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAuthUrl } from '@/lib/oauth-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const companyId = session.user.companyId;
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

    // 3. Obtener redirectTo de query params
    const { searchParams } = new URL(req.url);
    const redirectTo = searchParams.get('redirectTo') || '/dashboard/settings/integrations';

    // 4. Generar URL de autorización
    const { url, state } = await generateAuthUrl(
      platform as any,
      companyId,
      session.user.id,
      redirectTo
    );

    logger.info(`🔐 OAuth flow initiated for ${platform}`, {
      companyId,
      userId: session.user.id,
    });

    // 5. Redirigir a la URL de autorización
    return NextResponse.redirect(url);

  } catch (error: any) {
    logger.error('❌ Error initiating OAuth flow:', error);
    
    return NextResponse.json(
      {
        error: 'Error iniciando autorización',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

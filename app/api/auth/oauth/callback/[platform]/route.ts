/**
 * API Endpoint: OAuth Callback
 * 
 * GET /api/auth/oauth/callback/[platform]
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateState,
  exchangeCodeForToken,
  saveTokens,
  getAccountInfo,
} from '@/lib/oauth-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 1. Manejar error de autorización
    if (error) {
      logger.warn(`⚠️ OAuth error: ${error}`, { errorDescription });
      
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    // 2. Validar parámetros
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=missing_params`
      );
    }

    // 3. Validar state token
    const stateData = await validateState(state);
    if (!stateData) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=invalid_state`
      );
    }

    // 4. Validar plataforma
    const platform = params.platform.toUpperCase();
    if (platform !== stateData.platform) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=platform_mismatch`
      );
    }

    // 5. Intercambiar código por tokens
    const tokens = await exchangeCodeForToken(platform as any, code);

    // 6. Obtener información de la cuenta
    const accountInfo = await getAccountInfo(platform as any, tokens.accessToken);

    // 7. Guardar tokens en BD
    await saveTokens(
      stateData.companyId,
      stateData.userId,
      platform as any,
      tokens,
      accountInfo
    );

    logger.info(`✅ OAuth completed for ${platform}`, {
      companyId: stateData.companyId,
      accountName: accountInfo?.name,
    });

    // 8. Redirigir de vuelta con éxito
    const redirectUrl = stateData.redirectTo || '/dashboard/settings/integrations';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectUrl}?success=${platform.toLowerCase()}_connected`
    );

  } catch (error: any) {
    logger.error('❌ Error in OAuth callback:', error);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=${encodeURIComponent(
        error.message
      )}`
    );
  }
}

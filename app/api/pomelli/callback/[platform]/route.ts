/**
 * API ENDPOINT: Callback OAuth para redes sociales
 * Maneja el retorno después de autorizar una red social
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPomelliService, type SocialPlatform } from '@/lib/pomelli-integration';

export async function GET(request: NextRequest, { params }: { params: { platform: string } }) {
  try {
    const { platform } = params;
    const searchParams = request.nextUrl.searchParams;
    const authCode = searchParams.get('code');
    const companyId = searchParams.get('company');
    const error = searchParams.get('error');

    if (error) {
      // Usuario canceló autorización
      return NextResponse.redirect(new URL(`/dashboard/social-media?error=${error}`, request.url));
    }

    if (!authCode || !companyId) {
      return NextResponse.redirect(
        new URL('/dashboard/social-media?error=missing_params', request.url)
      );
    }

    if (!['linkedin', 'instagram', 'x', 'facebook'].includes(platform)) {
      return NextResponse.redirect(
        new URL('/dashboard/social-media?error=invalid_platform', request.url)
      );
    }

    // Verificar que existe configuración de Pomelli
    const config = await prisma.pomelliConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      return NextResponse.redirect(
        new URL('/dashboard/social-media?error=not_configured', request.url)
      );
    }

    // Obtener servicio de Pomelli
    const pomelliService = getPomelliService();

    if (!pomelliService) {
      return NextResponse.redirect(
        new URL('/dashboard/social-media?error=service_error', request.url)
      );
    }

    // Conectar perfil
    const profile = await pomelliService.handleOAuthCallback(
      platform as SocialPlatform,
      authCode,
      companyId
    );

    // Guardar perfil en base de datos
    await prisma.socialProfile.create({
      data: {
        companyId,
        pomelliConfigId: config.id,
        platform,
        profileId: profile.profileId,
        profileName: profile.profileName,
        profileUsername: profile.profileUsername,
        profileUrl: profile.profileUrl,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        tokenExpiresAt: profile.tokenExpiresAt,
        isActive: true,
        isConnected: true,
        lastSyncAt: new Date(),
        metadata: profile.metadata as any,
      },
    });

    logger.info(`${platform} profile connected for company ${companyId}`);

    // Redirigir al dashboard con éxito
    return NextResponse.redirect(
      new URL(`/dashboard/social-media?success=${platform}`, request.url)
    );
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/social-media?error=callback_failed', request.url)
    );
  }
}

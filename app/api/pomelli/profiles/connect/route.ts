export const dynamic = 'force-dynamic';

/**
 * API ENDPOINT: Conectar perfiles de redes sociales
 * POST: Iniciar conexión de perfil (obtener URL de autorización)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPomelliService, type SocialPlatform } from '@/lib/pomelli-integration';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { platform } = body as { platform: SocialPlatform };

    if (!platform || !['linkedin', 'instagram', 'x', 'facebook'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma inválida' },
        { status: 400 }
      );
    }

    // Verificar que existe configuración de Pomelli
    const config = await prisma.pomelliConfig.findUnique({
      where: { companyId: user.companyId },
    });

    if (!config || !config.enabled) {
      return NextResponse.json(
        { error: 'Pomelli no está configurado' },
        { status: 400 }
      );
    }

    // Obtener servicio de Pomelli
    const pomelliService = getPomelliService();
    
    if (!pomelliService) {
      return NextResponse.json(
        { error: 'Error al inicializar servicio de Pomelli' },
        { status: 500 }
      );
    }

    // Obtener URLs de autorización
    const authUrls = await pomelliService.initializeSocialProfiles(user.companyId);

    const authUrl = authUrls[platform as keyof typeof authUrls];

    if (!authUrl) {
      return NextResponse.json(
        { error: 'No se pudo generar URL de autorización' },
        { status: 500 }
      );
    }

    logger.info(`Authorization URL generated for ${platform} - company ${user.companyId}`);

    return NextResponse.json({
      success: true,
      authUrl,
      platform,
    });
  } catch (error) {
    logger.error('Error connecting social profile:', error);
    return NextResponse.json(
      { error: 'Error al conectar perfil social' },
      { status: 500 }
    );
  }
}

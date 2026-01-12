export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API ENDPOINT: Gestión de publicaciones en redes sociales
 * GET: Listar publicaciones
 * POST: Crear nueva publicación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPomelliService, type SocialPlatform, type ContentType } from '@/lib/pomelli-integration';

export async function GET(request: NextRequest) {
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
      select: { companyId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platforms = {
        has: platform,
      };
    }

    // Obtener publicaciones
    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          profiles: {
            select: {
              id: true,
              platform: true,
              profileName: true,
              profileUsername: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.socialPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error getting posts:', error);
    return NextResponse.json(
      { error: 'Error al obtener publicaciones' },
      { status: 500 }
    );
  }
}

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
      select: { companyId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      content,
      contentType,
      platforms,
      mediaUrls,
      scheduledAt,
      publishNow,
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos una plataforma' },
        { status: 400 }
      );
    }

    // Validar que las plataformas están conectadas
    const connectedProfiles = await prisma.socialProfile.findMany({
      where: {
        companyId: user.companyId,
        platform: {
          in: platforms,
        },
        isConnected: true,
        isActive: true,
      },
    });

    if (connectedProfiles.length !== platforms.length) {
      return NextResponse.json(
        { error: 'Algunas plataformas no están conectadas' },
        { status: 400 }
      );
    }

    // Obtener configuración de Pomelli
    const config = await prisma.pomelliConfig.findUnique({
      where: { companyId: user.companyId },
    });

    if (!config) {
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

    // Crear post en Pomelli
    const postData = {
      companyId: user.companyId,
      platforms: platforms as SocialPlatform[],
      content,
      contentType: contentType as ContentType || 'text',
      mediaUrls: mediaUrls || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: session.user.id,
    };

    const socialPost = await pomelliService.createMultiPlatformPost(postData);

    // Guardar en base de datos
    const savedPost = await prisma.socialPost.create({
      data: {
        companyId: user.companyId,
        pomelliConfigId: config.id,
        userId: session.user.id,
        content,
        contentType: contentType || 'text',
        mediaUrls: mediaUrls || [],
        platforms,
        status: publishNow ? 'published' : (scheduledAt ? 'scheduled' : 'draft'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishNow ? new Date() : null,
        pomelliPostId: socialPost.pomelliPostId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        profiles: true,
      },
    });

    // Si es publicación inmediata, publicar ahora
    if (publishNow && socialPost.pomelliPostId) {
      await pomelliService['client'].publishNow(socialPost.pomelliPostId);
    }

    logger.info(`Post created: ${savedPost.id} for company ${user.companyId}`);

    return NextResponse.json({
      success: true,
      post: savedPost,
    });
  } catch (error) {
    logger.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Error al crear publicación' },
      { status: 500 }
    );
  }
}

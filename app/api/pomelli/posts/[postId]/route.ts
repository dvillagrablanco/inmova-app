/**
 * API ENDPOINT: Gestión de publicación individual
 * GET: Obtener detalles de publicación
 * PATCH: Actualizar publicación
 * DELETE: Eliminar publicación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPomelliService } from '@/lib/pomelli-integration';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    const post = await prisma.socialPost.findUnique({
      where: {
        id: params.postId,
        companyId: user.companyId,
      },
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
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Si tiene analytics en Pomelli, actualizarlos
    if (post.pomelliPostId && post.status === 'published') {
      try {
        const pomelliService = getPomelliService();
        if (pomelliService) {
          const analytics = await pomelliService['client'].getPostAnalytics(post.pomelliPostId);
          
          // Actualizar analytics en DB
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              impressions: analytics.impressions,
              reach: analytics.reach,
              likes: analytics.likes,
              comments: analytics.comments,
              shares: analytics.shares,
              clicks: analytics.clicks,
              engagementRate: analytics.engagement_rate,
            },
          });

          // Añadir analytics al post
          (post as any).analytics = analytics;
        }
      } catch (error) {
        logger.error('Error fetching analytics:', error);
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.error('Error getting post:', error);
    return NextResponse.json(
      { error: 'Error al obtener publicación' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    const post = await prisma.socialPost.findUnique({
      where: {
        id: params.postId,
        companyId: user.companyId,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Solo se pueden editar posts en draft o scheduled
    if (post.status === 'published' || post.status === 'archived') {
      return NextResponse.json(
        { error: 'No se pueden editar publicaciones publicadas o archivadas' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, contentType, mediaUrls, scheduledAt } = body;

    // Actualizar en Pomelli si existe
    if (post.pomelliPostId) {
      const pomelliService = getPomelliService();
      if (pomelliService) {
        await pomelliService['client'].updatePost(post.pomelliPostId, {
          content,
          mediaUrls,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
      }
    }

    // Actualizar en DB
    const updatedPost = await prisma.socialPost.update({
      where: { id: params.postId },
      data: {
        content: content || post.content,
        contentType: contentType || post.contentType,
        mediaUrls: mediaUrls || post.mediaUrls,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : post.scheduledAt,
        updatedAt: new Date(),
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

    logger.info(`Post updated: ${params.postId}`);

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    logger.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Error al actualizar publicación' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    const post = await prisma.socialPost.findUnique({
      where: {
        id: params.postId,
        companyId: user.companyId,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar de Pomelli si existe
    if (post.pomelliPostId) {
      try {
        const pomelliService = getPomelliService();
        if (pomelliService) {
          await pomelliService['client'].deletePost(post.pomelliPostId);
        }
      } catch (error) {
        logger.error('Error deleting from Pomelli:', error);
      }
    }

    // Eliminar de DB
    await prisma.socialPost.delete({
      where: { id: params.postId },
    });

    logger.info(`Post deleted: ${params.postId}`);

    return NextResponse.json({
      success: true,
      message: 'Publicación eliminada correctamente',
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Error al eliminar publicación' },
      { status: 500 }
    );
  }
}

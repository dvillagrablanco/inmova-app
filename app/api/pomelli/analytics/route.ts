export const dynamic = 'force-dynamic';

/**
 * API ENDPOINT: Analytics de redes sociales
 * GET: Obtener métricas consolidadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
    const platform = searchParams.get('platform');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Construir filtros
    const where: any = {
      companyId: user.companyId,
      status: 'published',
    };

    if (platform) {
      where.platforms = {
        has: platform,
      };
    }

    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) {
        where.publishedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.publishedAt.lte = new Date(dateTo);
      }
    }

    // Obtener estadísticas agregadas
    const posts = await prisma.socialPost.findMany({
      where,
      select: {
        impressions: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
        engagementRate: true,
        platforms: true,
      },
    });

    // Calcular totales
    const totals = posts.reduce(
      (acc, post) => {
        acc.impressions += post.impressions;
        acc.reach += post.reach;
        acc.likes += post.likes;
        acc.comments += post.comments;
        acc.shares += post.shares;
        acc.clicks += post.clicks;
        acc.postsCount += 1;
        return acc;
      },
      {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        postsCount: 0,
      }
    );

    // Calcular engagement rate promedio
    const avgEngagementRate = posts.length > 0
      ? posts.reduce((sum, post) => sum + post.engagementRate, 0) / posts.length
      : 0;

    // Agrupar por plataforma
    const byPlatform: Record<string, any> = {};
    
    posts.forEach((post) => {
      post.platforms.forEach((platform) => {
        if (!byPlatform[platform]) {
          byPlatform[platform] = {
            impressions: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
            postsCount: 0,
          };
        }
        
        // Distribuir métricas proporcionalmente
        const platformCount = post.platforms.length;
        byPlatform[platform].impressions += Math.floor(post.impressions / platformCount);
        byPlatform[platform].reach += Math.floor(post.reach / platformCount);
        byPlatform[platform].likes += Math.floor(post.likes / platformCount);
        byPlatform[platform].comments += Math.floor(post.comments / platformCount);
        byPlatform[platform].shares += Math.floor(post.shares / platformCount);
        byPlatform[platform].clicks += Math.floor(post.clicks / platformCount);
        byPlatform[platform].postsCount += 1;
      });
    });

    // Obtener perfiles conectados con stats
    const profiles = await prisma.socialProfile.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
        isConnected: true,
      },
      select: {
        id: true,
        platform: true,
        profileName: true,
        profileUsername: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        lastSyncAt: true,
      },
    });

    return NextResponse.json({
      totals: {
        ...totals,
        avgEngagementRate,
      },
      byPlatform,
      profiles,
      period: {
        from: dateFrom || 'all_time',
        to: dateTo || 'now',
      },
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}

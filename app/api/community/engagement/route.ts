import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hasPermission, forbiddenResponse } from '@/lib/permissions';

// GET - Obtener métricas de engagement
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Verificar permiso de ver engagement
    if (!hasPermission(user.role, 'viewEngagement')) {
      return forbiddenResponse('No tienes permiso para ver métricas de engagement');
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const period = searchParams.get('period') || '30'; // días

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Calcular métricas en tiempo real
    const [events, posts, announcements, attendees, comments, reactions] = await Promise.all([
      // Eventos
      prisma.communityEvent.count({
        where: {
          companyId: user.companyId,
          ...(buildingId && { buildingId }),
          createdAt: { gte: startDate },
        },
      }),
      // Posts
      prisma.socialPost.aggregate({
        where: {
          companyId: user.companyId,
          ...(buildingId && { buildingId }),
          createdAt: { gte: startDate },
        },
        _count: true,
        _sum: { likes: true },
      }),
      // Anuncios
      prisma.communityAnnouncement.count({
        where: {
          companyId: user.companyId,
          ...(buildingId && { buildingId }),
          createdAt: { gte: startDate },
        },
      }),
      // Asistentes a eventos
      prisma.eventAttendee.count({
        where: {
          createdAt: { gte: startDate },
          confirmado: true,
        },
      }),
      // Comentarios
      prisma.socialComment.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Reacciones
      prisma.postReaction.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Tendencias (comparar con periodo anterior)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));

    const [previousEvents, previousPosts] = await Promise.all([
      prisma.communityEvent.count({
        where: {
          companyId: user.companyId,
          ...(buildingId && { buildingId }),
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
      prisma.socialPost.count({
        where: {
          companyId: user.companyId,
          ...(buildingId && { buildingId }),
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
    ]);

    const metrics = {
      periodo: `${period} días`,
      eventos: {
        total: events,
        asistenciasConfirmadas: attendees,
        tendencia:
          previousEvents > 0 ? (((events - previousEvents) / previousEvents) * 100).toFixed(1) : 0,
      },
      posts: {
        total: posts._count,
        totalLikes: posts._sum?.likes || 0,
        totalComentarios: comments,
        tendencia:
          previousPosts > 0
            ? (((posts._count - previousPosts) / previousPosts) * 100).toFixed(1)
            : 0,
      },
      anuncios: {
        total: announcements,
      },
      interacciones: {
        total: (posts._sum?.likes || 0) + comments + reactions + attendees,
        reacciones: reactions,
        comentarios: comments,
      },
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notification-logs
 * Obtiene el historial de notificaciones enviadas
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const canal = searchParams.get('canal');
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.companyId,
    };

    if (canal) where.canal = canal;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rule: {
            select: {
              id: true,
              nombre: true,
            },
          },
          template: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          enviadoEn: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al obtener logs de notificaciones:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener logs de notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notification-logs/stats
 * Obtiene estadísticas de notificaciones
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = await prisma.notificationLog.groupBy({
        by: ['canal', 'estado'],
        where: {
          companyId: user.companyId,
          enviadoEn: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      });

      // Calcular tasa de éxito por canal
      const channelStats: Record<string, any> = {};
      stats.forEach(stat => {
        if (!channelStats[stat.canal]) {
          channelStats[stat.canal] = {
            canal: stat.canal,
            total: 0,
            enviado: 0,
            fallido: 0,
            leido: 0,
          };
        }
        channelStats[stat.canal].total += stat._count;
        if (stat.estado === 'enviado') channelStats[stat.canal].enviado += stat._count;
        if (stat.estado === 'fallido') channelStats[stat.canal].fallido += stat._count;
        if (stat.estado === 'leido') channelStats[stat.canal].leido += stat._count;
      });

      return NextResponse.json({
        stats: Object.values(channelStats),
        period: '30 días',
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error al obtener estadísticas de notificaciones:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de notificaciones' },
      { status: 500 }
    );
  }
}
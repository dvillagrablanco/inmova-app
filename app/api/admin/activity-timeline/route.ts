import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');

    // Construir filtros
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (action) {
      where.action = action;
    }

    // Obtener actividad
    const activities = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Agrupar por fecha
    const groupedByDate: Record<string, typeof activities> = {};
    activities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(activity);
    });

    // Estadísticas de acciones
    const actionStats = activities.reduce(
      (acc: Record<string, number>, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      activities,
      groupedByDate,
      actionStats,
      total: activities.length,
    });
  } catch (error) {
    logger.error('Error fetching activity timeline:', error);
    return NextResponse.json(
      { error: 'Error al obtener timeline' },
      { status: 500 }
    );
  }
}

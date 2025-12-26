export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

// GET - Obtener estadísticas de sugerencias
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Solo super_admin puede ver estadísticas
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver estadísticas' },
        { status: 403 }
      );
    }

    const [total, porEstado, porPrioridad, porCategoria, recientes] = await Promise.all([
      prisma.suggestion.count(),
      prisma.suggestion.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.suggestion.groupBy({
        by: ['prioridad'],
        _count: true,
      }),
      prisma.suggestion.groupBy({
        by: ['categoria'],
        _count: true,
      }),
      prisma.suggestion.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          company: {
            select: {
              nombre: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      porEstado: Object.fromEntries(porEstado.map((e) => [e.estado, e._count])),
      porPrioridad: Object.fromEntries(porPrioridad.map((p) => [p.prioridad, p._count])),
      porCategoria: Object.fromEntries(porCategoria.map((c) => [c.categoria, c._count])),
      recientes,
    });
  } catch (error: any) {
    logger.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener estadísticas de sugerencias
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
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
      porEstado: Object.fromEntries(
        porEstado.map((e) => [e.estado, e._count])
      ),
      porPrioridad: Object.fromEntries(
        porPrioridad.map((p) => [p.prioridad, p._count])
      ),
      porCategoria: Object.fromEntries(
        porCategoria.map((c) => [c.categoria, c._count])
      ),
      recientes,
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    if (error.message === 'No autenticado' || error.message === 'No autorizado' || error.message === 'Usuario inactivo') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    logger.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

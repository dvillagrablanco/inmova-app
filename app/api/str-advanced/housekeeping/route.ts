import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    const tasks = await prisma.sTRHousekeepingTask.findMany({
      where: { companyId },
      include: {
        listing: { select: { titulo: true } },
      },
      orderBy: { fechaProgramada: 'asc' },
      take: 50,
    });

    const mapped = tasks.map((t: any) => ({
      id: t.id,
      property: t.listing?.titulo || '',
      date: t.fechaProgramada?.toISOString().split('T')[0] || '',
      time: t.horaInicio || '',
      status: t.status,
      priority: t.prioridad || 'media',
      estimatedTime: t.tiempoEstimadoMin || 0,
      cleaner: t.asignadoNombre || '',
      progress: t.status === 'completado' ? 100 : t.status === 'en_progreso' ? 50 : 0,
    }));

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    logger.error('[STR Housekeeping GET]:', error);
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
  }
}

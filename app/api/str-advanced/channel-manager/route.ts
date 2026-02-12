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

    const syncs = await prisma.sTRChannelSync.findMany({
      where: { companyId },
      include: {
        listing: { select: { titulo: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Agrupar por canal
    const channelMap = new Map<string, { bookings: number; lastSync: string | null }>();
    for (const s of syncs) {
      const canal = s.canal || 'OTHER';
      const existing = channelMap.get(canal) || { bookings: 0, lastSync: null };
      existing.bookings += 1;
      if (s.ultimaSync) {
        const syncDate = s.ultimaSync.toISOString();
        if (!existing.lastSync || syncDate > existing.lastSync) {
          existing.lastSync = syncDate;
        }
      }
      channelMap.set(canal, existing);
    }

    const channels = Array.from(channelMap.entries()).map(([canal, data], i) => ({
      id: String(i + 1),
      name: canal,
      status: data.lastSync ? 'conectado' : 'desconectado',
      lastSync: data.lastSync,
      bookings: data.bookings,
    }));

    return NextResponse.json({ data: channels });
  } catch (error: any) {
    logger.error('[STR Channel Manager GET]:', error);
    return NextResponse.json({ error: 'Error al obtener canales' }, { status: 500 });
  }
}

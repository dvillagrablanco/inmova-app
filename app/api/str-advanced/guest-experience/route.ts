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

    const reviews = await prisma.sTRReview.findMany({
      where: {
        listing: { companyId },
      },
      include: {
        listing: { select: { titulo: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });

    const mapped = reviews.map((r: any) => ({
      id: r.id,
      guest: r.guestNombre,
      property: r.listing?.titulo || '',
      rating: r.rating,
      date: r.fecha?.toISOString().split('T')[0] || '',
      comment: r.comentario,
    }));

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    logger.error('[STR Guest Experience GET]:', error);
    return NextResponse.json({ error: 'Error al obtener reviews' }, { status: 500 });
  }
}

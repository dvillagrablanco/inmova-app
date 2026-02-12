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

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const history = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id,
        companyId
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    logger.error('Error al obtener historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    await prisma.searchHistory.deleteMany({
      where: {
        userId: session.user.id,
        companyId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error al limpiar historial:', error);
    return NextResponse.json(
      { error: 'Error al limpiar historial' },
      { status: 500 }
    );
  }
}

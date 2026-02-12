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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const companyId = session?.user?.companyId;

    const where: any = { companyId };
    if (tipo) where.tipo = tipo;

    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: {
        fechaObjetivo: 'asc',
      },
      take: 20,
    });

    return NextResponse.json({ predictions });
  } catch (error: any) {
    logger.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar predicciones' },
      { status: 500 }
    );
  }
}

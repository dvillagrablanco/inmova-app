import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { aplicada } = await request.json();

    const recommendation = await prisma.recommendation.update({
      where: { id: params.id },
      data: {
        aplicada,
        ...(aplicada && { fechaAplicacion: new Date() }),
      },
    });

    return NextResponse.json({ recommendation });
  } catch (error: any) {
    logger.error('Error updating recommendation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar recomendación' },
      { status: 500 }
    );
  }
}

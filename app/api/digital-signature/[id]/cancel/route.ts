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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await req.json().catch(() => ({}));

    await prisma.documentoFirma.update({
      where: { id: params.id },
      data: {
        estado: 'CANCELLED',
        canceladoEn: new Date(),
        canceladoPor: session.user.id as string,
        motivoCancelacion: body.motivo || 'Cancelado por el usuario',
      },
    });

    logger.info(`[Digital Signature] Cancelled ${params.id} by ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Solicitud de firma cancelada',
    });
  } catch (error: any) {
    logger.error('[Digital Signature] Error cancel:', error);
    return NextResponse.json({ error: 'Error cancelando documento' }, { status: 500 });
  }
}
